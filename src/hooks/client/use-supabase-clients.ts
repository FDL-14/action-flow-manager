import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

export const fetchSupabaseClients = async () => {
  try {
    // Modificado para incluir o join com a tabela companies
    const { data, error } = await supabase
      .from('clients')
      .select('*, companies(name)');
      
    if (error) {
      console.error("Erro ao buscar clientes do Supabase:", error);
      return null;
    }
    
    if (data && data.length > 0) {
      return data.map(c => {
        // Extrair o nome da empresa do join, se disponível
        let companyName;
        
        if (c.companies) {
          // Check if companies is an object (not an array) and has name property
          if (typeof c.companies === 'object' && !Array.isArray(c.companies) && c.companies.name) {
            companyName = c.companies.name;
          }
        }
        
        console.log(`Cliente carregado: ${c.name}, Empresa: ${companyName || 'não definida'}`);
        
        return {
          id: c.id,
          name: c.name,
          email: c.contact_email || undefined,
          phone: c.contact_phone || undefined,
          address: undefined,
          cnpj: undefined,
          companyId: c.company_id || '',
          companyName: companyName, 
          createdAt: new Date(c.created_at || new Date()),
          updatedAt: new Date(c.updated_at || new Date())
        };
      });
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
      .select('id, name')
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
    
    // Tratamento similar ao addSupabaseClient para garantir UUID válido
    let companyId = clientData.companyId;
    let companyName = clientData.companyName;
    
    console.log("Adicionando cliente para empresa:", { id: companyId, nome: companyName });
    
    // Se não for um UUID válido, tratamos como um ID temporário e procuramos a empresa pelo nome
    if (!isValidUUID(companyId)) {
      console.log("ID da empresa não é um UUID válido, buscando empresa por nome ou criando uma nova");
      
      // Buscar empresa por nome se disponível
      if (companyName) {
        const { data: existingCompanies } = await supabase
          .from('companies')
          .select('id, name')
          .eq('name', companyName)
          .limit(1);
          
        if (existingCompanies && existingCompanies.length > 0) {
          companyId = existingCompanies[0].id;
          console.log(`Empresa encontrada pelo nome "${companyName}": ${companyId}`);
        } else {
          // Criar uma nova empresa
          const { data: newCompany, error } = await supabase
            .from('companies')
            .insert({
              name: companyName || 'Empresa do Cliente',
            })
            .select()
            .single();
            
          if (error) {
            console.error('Erro ao criar nova empresa:', error);
            throw error;
          }
          
          companyId = newCompany.id;
          companyName = newCompany.name;
          console.log(`Nova empresa criada com ID: ${companyId} e nome: ${companyName}`);
        }
      } else {
        // Fallback para empresas existentes
        const { data: fallbackCompany } = await supabase
          .from('companies')
          .select('id, name')
          .limit(1);
          
        if (fallbackCompany && fallbackCompany.length > 0) {
          companyId = fallbackCompany[0].id;
          companyName = fallbackCompany[0].name;
          console.log(`Usando empresa existente como fallback: ${companyId} (${companyName})`);
        } else {
          throw new Error("Não foi possível encontrar ou criar uma empresa válida");
        }
      }
    } else {
      // Se temos um UUID válido, vamos buscar o nome da empresa para garantir que temos essa informação
      if (!companyName) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();
          
        if (companyData) {
          companyName = companyData.name;
          console.log(`Nome da empresa recuperado para ID ${companyId}: ${companyName}`);
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
      .select('*, companies(name)')
      .single();
      
    if (error) {
      console.error('Erro ao salvar cliente no Supabase:', error);
      throw error;
    }
    
    // Extrair corretamente o nome da empresa da resposta
    let finalCompanyName = companyName || 'Empresa associada';
    
    // Verificar se temos acesso ao nome da empresa através do join
    if (supabaseClient.companies && typeof supabaseClient.companies === 'object' && !Array.isArray(supabaseClient.companies)) {
      finalCompanyName = supabaseClient.companies.name || finalCompanyName;
    }
    
    console.log('Cliente salvo com sucesso:', {
      ...supabaseClient,
      company_name: finalCompanyName
    });
    
    return {
      ...supabaseClient,
      company_name: finalCompanyName
    };
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
    let companyName = clientData.companyName;
    
    console.log("Atualizando cliente com dados de empresa:", { id: companyId, nome: companyName });
    
    if (!isValidUUID(companyId)) {
      console.log("ID da empresa na atualização não é um UUID válido, buscando empresa existente");
      
      if (companyName) {
        const { data: existingCompanies } = await supabase
          .from('companies')
          .select('id, name')
          .eq('name', companyName)
          .limit(1);
          
        if (existingCompanies && existingCompanies.length > 0) {
          companyId = existingCompanies[0].id;
          console.log(`Empresa encontrada pelo nome "${companyName}": ${companyId}`);
        } else {
          // Criar uma nova empresa se necessário
          const { data: newCompany, error } = await supabase
            .from('companies')
            .insert({
              name: companyName
            })
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          companyId = newCompany.id;
          companyName = newCompany.name;
          console.log(`Nova empresa criada com ID: ${companyId} e nome: ${companyName}`);
        }
      } else {
        // Obter o ID atual da empresa para preservar a relação
        const { data: currentClient } = await supabase
          .from('clients')
          .select('company_id, companies(name)')
          .eq('id', clientId)
          .single();
          
        if (currentClient && currentClient.company_id) {
          companyId = currentClient.company_id;
          
          // Extrair corretamente o nome da empresa
          // Verificar se companies existe
          if (currentClient.companies) {
            // Tratamento específico para evitar o erro TS2339
            const companiesObj = currentClient.companies;
            
            // Verificar se é um objeto e não um array
            if (typeof companiesObj === 'object' && !Array.isArray(companiesObj)) {
              // Usar uma asserção de tipo para garantir que podemos acessar a propriedade 'name'
              // Primeiro verificamos se a propriedade existe usando o operador 'in'
              if ('name' in companiesObj) {
                companyName = (companiesObj as { name: string }).name;
              } else {
                companyName = null;
              }
            } else {
              companyName = null;
            }
          } else {
            companyName = null;
          }
          
          console.log(`Mantendo empresa atual: ${companyId} (${companyName || 'sem nome'})`);
        } else {
          // Fallback para qualquer empresa existente
          const { data: fallbackCompany } = await supabase
            .from('companies')
            .select('id, name')
            .limit(1);
            
          if (fallbackCompany && fallbackCompany.length > 0) {
            companyId = fallbackCompany[0].id;
            companyName = fallbackCompany[0].name;
            console.log(`Usando empresa de fallback: ${companyId} (${companyName})`);
          } else {
            throw new Error("Não foi possível encontrar uma empresa válida");
          }
        }
      }
    } else if (!companyName) {
      // Se temos um UUID válido, vamos buscar o nome da empresa
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
        
      if (companyData) {
        companyName = companyData.name;
        console.log(`Nome da empresa recuperado para ID ${companyId}: ${companyName}`);
      }
    }
    
    console.log(`Atualizando cliente ${clientId} com empresa: ${companyId} (${companyName || 'sem nome'})`);
    
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
    
    console.log('Cliente atualizado com sucesso. ID:', clientId);
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
