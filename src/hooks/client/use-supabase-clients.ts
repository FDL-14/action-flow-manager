
import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

export const fetchSupabaseClients = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
      
    if (error) {
      console.error("Erro ao buscar clientes do Supabase:", error);
      return null;
    }
    
    if (data && data.length > 0) {
      return data.map(c => ({
        id: c.id,
        name: c.name,
        email: c.contact_email || undefined,
        phone: c.contact_phone || undefined,
        address: undefined,
        cnpj: undefined,
        companyId: c.company_id || '',
        createdAt: new Date(c.created_at || new Date()),
        updatedAt: new Date(c.updated_at || new Date())
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return null;
  }
};

// Função para verificar se uma empresa existe no Supabase
export const checkSupabaseCompanyExists = async (companyId: string): Promise<boolean> => {
  if (!companyId) return false;
  
  console.log("Verificando se empresa existe no Supabase:", companyId);
  
  try {
    // Garantir que estamos usando um UUID válido
    if (!isValidUUID(companyId)) {
      console.error("ID da empresa não é um UUID válido:", companyId);
      return false;
    }
    
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Código para nenhum registro encontrado
        console.log("Empresa não encontrada no Supabase");
        return false;
      }
      console.error("Erro ao verificar empresa:", error);
      return false;
    }
    
    console.log("Empresa encontrada no Supabase:", data);
    return !!data;
  } catch (error) {
    console.error("Erro ao verificar empresa:", error);
    return false;
  }
};

// Função para validar se uma string é um UUID válido
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Função para adicionar empresa ao Supabase se necessário
export const ensureSupabaseCompanyExists = async (companyData: any) => {
  if (!companyData || !companyData.id) {
    console.error("Dados de empresa inválidos");
    return null;
  }
  
  try {
    // Verifica se a empresa já existe
    const exists = await checkSupabaseCompanyExists(companyData.id);
    
    if (!exists) {
      console.log("Empresa não existe no Supabase. Criando...", companyData);
      
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
        console.error("Erro ao criar empresa no Supabase:", error);
        return null;
      }
      
      console.log("Empresa criada com sucesso no Supabase:", data);
      return data.id;
    }
    
    return companyData.id;
  } catch (error) {
    console.error("Erro ao garantir existência da empresa:", error);
    return null;
  }
};

export const addSupabaseClient = async (clientData: any) => {
  try {
    if (!clientData.companyId) {
      throw new Error("ID da empresa é obrigatório");
    }
    
    // Verificamos se o ID da empresa é um UUID válido
    // Se não for, precisamos obter o UUID correto da empresa pelo nome ou criar uma nova
    let companyId = clientData.companyId;
    
    // Se não for um UUID válido, tratamos como um ID temporário e procuramos a empresa pelo nome
    if (!isValidUUID(companyId)) {
      console.log("ID da empresa não é um UUID válido, buscando empresa por nome ou criando uma nova");
      
      // Buscar empresa por nome se disponível
      if (clientData.companyName) {
        const { data: existingCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('name', clientData.companyName)
          .limit(1);
          
        if (existingCompanies && existingCompanies.length > 0) {
          companyId = existingCompanies[0].id;
          console.log(`Empresa encontrada pelo nome "${clientData.companyName}": ${companyId}`);
        } else {
          // Criar uma nova empresa
          const { data: newCompany, error } = await supabase
            .from('companies')
            .insert({
              name: clientData.companyName || 'Empresa do Cliente',
            })
            .select()
            .single();
            
          if (error) {
            console.error('Erro ao criar nova empresa:', error);
            throw error;
          }
          
          companyId = newCompany.id;
          console.log(`Nova empresa criada com ID: ${companyId}`);
        }
      } else {
        // Fallback para empresas existentes
        const { data: fallbackCompany } = await supabase
          .from('companies')
          .select('id')
          .limit(1);
          
        if (fallbackCompany && fallbackCompany.length > 0) {
          companyId = fallbackCompany[0].id;
          console.log(`Usando empresa existente como fallback: ${companyId}`);
        } else {
          throw new Error("Não foi possível encontrar ou criar uma empresa válida");
        }
      }
    }
    
    const { data: supabaseClient, error } = await supabase
      .from('clients')
      .insert({
        name: clientData.name,
        contact_email: clientData.email || null,
        contact_phone: clientData.phone || null,
        contact_name: clientData.name,
        company_id: companyId // Agora temos certeza que é um UUID válido
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('Erro ao salvar cliente no Supabase:', error);
      throw error;
    }
    
    return supabaseClient;
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error);
    throw error;
  }
};

export const updateSupabaseClient = async (clientId: string, clientData: any) => {
  try {
    if (!clientData.companyId) {
      throw new Error("ID da empresa é obrigatório");
    }
    
    // Tratamento similar ao addSupabaseClient para garantir UUID válido
    let companyId = clientData.companyId;
    
    if (!isValidUUID(companyId)) {
      console.log("ID da empresa na atualização não é um UUID válido, buscando empresa existente");
      
      if (clientData.companyName) {
        const { data: existingCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('name', clientData.companyName)
          .limit(1);
          
        if (existingCompanies && existingCompanies.length > 0) {
          companyId = existingCompanies[0].id;
        } else {
          // Criar uma nova empresa se necessário
          const { data: newCompany, error } = await supabase
            .from('companies')
            .insert({
              name: clientData.companyName
            })
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          companyId = newCompany.id;
        }
      } else {
        // Obter o ID atual da empresa para preservar a relação
        const { data: currentClient } = await supabase
          .from('clients')
          .select('company_id')
          .eq('id', clientId)
          .single();
          
        if (currentClient && currentClient.company_id) {
          companyId = currentClient.company_id;
        } else {
          // Fallback para qualquer empresa existente
          const { data: fallbackCompany } = await supabase
            .from('companies')
            .select('id')
            .limit(1);
            
          if (fallbackCompany && fallbackCompany.length > 0) {
            companyId = fallbackCompany[0].id;
          } else {
            throw new Error("Não foi possível encontrar uma empresa válida");
          }
        }
      }
    }
    
    const { error } = await supabase
      .from('clients')
      .update({
        name: clientData.name,
        contact_email: clientData.email || null,
        contact_phone: clientData.phone || null,
        contact_name: clientData.name,
        company_id: companyId,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);
      
    if (error) {
      console.error('Erro ao atualizar cliente no Supabase:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    throw error;
  }
};

export const deleteSupabaseClient = async (clientId: string) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
      
    if (error) {
      console.error('Erro ao excluir cliente no Supabase:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    throw error;
  }
};
