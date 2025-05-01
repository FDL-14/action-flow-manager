
import { supabase, retryOperation } from '@/integrations/supabase/client';
import { isValidUUID, logDebug } from './utils';

/**
 * Checks if a company exists in Supabase by its ID
 */
export const checkSupabaseCompanyExists = async (companyId: string): Promise<boolean> => {
  if (!companyId) return false;
  
  logDebug("Verificando se empresa existe no Supabase:", companyId);
  
  try {
    // Garantir que estamos usando um UUID válido
    if (!isValidUUID(companyId)) {
      logDebug("ID da empresa não é um UUID válido:", companyId);
      return false;
    }
    
    const { data, error } = await retryOperation(
      () => supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single(),
      3,
      500,
      'Check company exists'
    );
    
    if (error) {
      if (error.code === 'PGRST116') { // Código para nenhum registro encontrado
        logDebug("Empresa não encontrada no Supabase");
        return false;
      }
      logDebug("Erro ao verificar empresa:", error);
      return false;
    }
    
    logDebug("Empresa encontrada no Supabase:", data);
    return !!data;
  } catch (error) {
    logDebug("Erro ao verificar empresa:", error);
    return false;
  }
};

/**
 * Ensures a company exists in Supabase, creating it if necessary
 */
export const ensureSupabaseCompanyExists = async (companyData: any) => {
  if (!companyData) {
    logDebug("Dados de empresa inválidos");
    return null;
  }
  
  // Se temos apenas o nome e nenhum ID, criar pelo nome
  if (!companyData.id && companyData.name) {
    logDebug(`Criando empresa pelo nome: ${companyData.name}`);
    const company = await findOrCreateCompanyByName(companyData.name);
    return company?.id || null;
  }
  
  // Se não temos nem ID nem nome, não podemos continuar
  if (!companyData.id) {
    logDebug("Dados de empresa não tem ID");
    return null;
  }
  
  try {
    // Se não for um UUID válido e tivermos um nome, tentamos criar ou encontrar pelo nome
    if (!isValidUUID(companyData.id) && companyData.name) {
      logDebug(`ID não é um UUID válido. Tentando criar ou encontrar empresa pelo nome: ${companyData.name}`);
      const company = await findOrCreateCompanyByName(companyData.name);
      if (company) {
        logDebug(`Empresa encontrada/criada pelo nome. ID: ${company.id}`);
        return company.id;
      }
    }

    // Verifica se a empresa já existe
    const exists = await checkSupabaseCompanyExists(companyData.id);
    
    if (!exists) {
      logDebug("Empresa não existe no Supabase. Criando...", companyData);
      
      // Cria a empresa
      const { data, error } = await retryOperation(
        () => supabase
          .from('companies')
          .insert({
            id: isValidUUID(companyData.id) ? companyData.id : undefined, // Só usa o ID se for um UUID válido
            name: companyData.name || 'Empresa',
            address: companyData.address || null,
            phone: companyData.phone || null,
            cnpj: companyData.cnpj || null,
            logo: companyData.logo || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single(),
        3,
        500,
        'Create company'
      );
      
      if (error) {
        logDebug("Erro ao criar empresa no Supabase:", error);
        return null;
      }
      
      logDebug("Empresa criada com sucesso no Supabase:", data);
      return data.id;
    }
    
    return companyData.id;
  } catch (error) {
    logDebug("Erro ao garantir existência da empresa:", error);
    return null;
  }
};

/**
 * Finds or creates a company by name
 */
export const findOrCreateCompanyByName = async (companyName: string | undefined): Promise<{id: string, name: string | null} | null> => {
  try {
    if (!companyName) {
      // Fallback para empresas existentes
      const { data: fallbackCompany } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1);
        
      if (fallbackCompany && fallbackCompany.length > 0) {
        logDebug(`Usando empresa existente como fallback: ${fallbackCompany[0].id} (${fallbackCompany[0].name})`);
        return {
          id: fallbackCompany[0].id,
          name: fallbackCompany[0].name
        };
      }
      return null;
    }
    
    // Buscar empresa por nome
    const { data: existingCompanies } = await retryOperation(
      () => supabase
        .from('companies')
        .select('id, name')
        .eq('name', companyName)
        .limit(1),
      3,
      500,
      'Find company by name'
    );
      
    if (existingCompanies && existingCompanies.length > 0) {
      logDebug(`Empresa encontrada pelo nome "${companyName}": ${existingCompanies[0].id}`);
      return {
        id: existingCompanies[0].id,
        name: existingCompanies[0].name
      };
    }
    
    // Criar uma nova empresa
    const { data: newCompany, error } = await retryOperation(
      () => supabase
        .from('companies')
        .insert({
          name: companyName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
      3,
      500,
      'Create new company'
    );
      
    if (error) {
      logDebug('Erro ao criar nova empresa:', error);
      return null;
    }
    
    logDebug(`Nova empresa criada com ID: ${newCompany.id} e nome: ${newCompany.name}`);
    return {
      id: newCompany.id,
      name: newCompany.name
    };
  } catch (error) {
    logDebug('Erro ao encontrar ou criar empresa por nome:', error);
    return null;
  }
};

/**
 * Gets company name by ID
 */
export const getCompanyNameById = async (companyId: string): Promise<string | null> => {
  try {
    if (!isValidUUID(companyId)) {
      // Se não for um UUID válido, pode ser um ID local
      // Vamos retornar null e deixar a camada superior lidar com isso
      return null;
    }
    
    const { data } = await retryOperation(
      () => supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single(),
      3,
      500,
      'Get company name'
    );
      
    return data?.name || null;
  } catch (error) {
    logDebug('Erro ao buscar nome da empresa:', error);
    return null;
  }
};

/**
 * Sync all local companies to Supabase
 */
export const syncLocalCompaniesToSupabase = async (companies: any[]) => {
  if (!companies || companies.length === 0) {
    logDebug("Nenhuma empresa para sincronizar");
    return [];
  }
  
  const syncedCompanies = [];
  
  for (const company of companies) {
    try {
      // Garantir que a empresa existe no Supabase
      const companyId = await ensureSupabaseCompanyExists(company);
      if (companyId) {
        syncedCompanies.push({
          ...company,
          id: companyId
        });
      }
    } catch (error) {
      logDebug(`Erro ao sincronizar empresa ${company.name}:`, error);
    }
  }
  
  return syncedCompanies;
};

/**
 * Fetch all companies from Supabase
 */
export const fetchAllCompanies = async () => {
  try {
    const { data, error } = await retryOperation(
      () => supabase
        .from('companies')
        .select('*')
        .order('name'),
      3,
      500,
      'Fetch all companies'
    );
    
    if (error) {
      logDebug('Erro ao buscar todas as empresas:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    logDebug('Erro ao buscar empresas:', error);
    return null;
  }
};
