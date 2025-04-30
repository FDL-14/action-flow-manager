
import { supabase } from '@/integrations/supabase/client';
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
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();
    
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
  if (!companyData || !companyData.id) {
    logDebug("Dados de empresa inválidos");
    return null;
  }
  
  try {
    // Verifica se a empresa já existe
    const exists = await checkSupabaseCompanyExists(companyData.id);
    
    if (!exists) {
      logDebug("Empresa não existe no Supabase. Criando...", companyData);
      
      // Cria a empresa
      const { data, error } = await supabase
        .from('companies')
        .insert({
          id: companyData.id,
          name: companyData.name || 'Empresa',
          address: companyData.address || null,
          phone: companyData.phone || null,
          cnpj: companyData.cnpj || null,
          logo: companyData.logo || null
        })
        .select()
        .single();
      
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
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', companyName)
      .limit(1);
      
    if (existingCompanies && existingCompanies.length > 0) {
      logDebug(`Empresa encontrada pelo nome "${companyName}": ${existingCompanies[0].id}`);
      return {
        id: existingCompanies[0].id,
        name: existingCompanies[0].name
      };
    }
    
    // Criar uma nova empresa
    const { data: newCompany, error } = await supabase
      .from('companies')
      .insert({
        name: companyName
      })
      .select()
      .single();
      
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
      return null;
    }
    
    const { data } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();
      
    return data?.name || null;
  } catch (error) {
    logDebug('Erro ao buscar nome da empresa:', error);
    return null;
  }
};
