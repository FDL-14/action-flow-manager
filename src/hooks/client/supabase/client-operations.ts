
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/lib/types';
import { isValidUUID, logDebug } from './utils';
import { findOrCreateCompanyByName, getCompanyNameById, checkSupabaseCompanyExists } from './company-operations';

/**
 * Fetches all clients from Supabase with their associated companies
 */
export const fetchSupabaseClients = async () => {
  try {
    // Modificado para incluir o join com a tabela companies
    const { data, error } = await supabase
      .from('clients')
      .select('*, companies(name)');
      
    if (error) {
      logDebug("Erro ao buscar clientes do Supabase:", error);
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
        
        logDebug(`Cliente carregado: ${c.name}, Empresa: ${companyName || 'não definida'}`);
        
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
    logDebug("Erro ao buscar clientes:", error);
    return null;
  }
};

/**
 * Adds a new client to Supabase
 */
export const addSupabaseClient = async (clientData: any) => {
  try {
    if (!clientData.companyId) {
      throw new Error("ID da empresa é obrigatório");
    }
    
    // Tratamento similar ao addSupabaseClient para garantir UUID válido
    let companyId = clientData.companyId;
    let companyName = clientData.companyName;
    
    logDebug("Adicionando cliente para empresa:", { id: companyId, nome: companyName });
    
    // Se não for um UUID válido, tratamos como um ID temporário e procuramos a empresa pelo nome
    if (!isValidUUID(companyId)) {
      logDebug("ID da empresa não é um UUID válido, buscando empresa por nome ou criando uma nova");
      
      const company = await findOrCreateCompanyByName(companyName);
      if (company) {
        companyId = company.id;
        companyName = company.name;
      } else {
        throw new Error("Não foi possível encontrar ou criar uma empresa válida");
      }
    } else if (!companyName) {
      // Se temos um UUID válido, vamos buscar o nome da empresa para garantir que temos essa informação
      companyName = await getCompanyNameById(companyId);
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
      logDebug('Erro ao salvar cliente no Supabase:', error);
      throw error;
    }
    
    // Extrair corretamente o nome da empresa da resposta
    let finalCompanyName = companyName || 'Empresa associada';
    
    // Verificar se temos acesso ao nome da empresa através do join
    if (supabaseClient.companies && typeof supabaseClient.companies === 'object' && !Array.isArray(supabaseClient.companies)) {
      finalCompanyName = supabaseClient.companies.name || finalCompanyName;
    }
    
    logDebug('Cliente salvo com sucesso:', {
      ...supabaseClient,
      company_name: finalCompanyName
    });
    
    return {
      ...supabaseClient,
      company_name: finalCompanyName
    };
  } catch (error) {
    logDebug('Erro ao adicionar cliente:', error);
    throw error;
  }
};

/**
 * Updates an existing client in Supabase
 */
export const updateSupabaseClient = async (clientId: string, clientData: any) => {
  try {
    if (!clientData.companyId) {
      throw new Error("ID da empresa é obrigatório");
    }
    
    // Tratamento similar ao addSupabaseClient para garantir UUID válido
    let companyId = clientData.companyId;
    let companyName = clientData.companyName;
    
    logDebug("Atualizando cliente com dados de empresa:", { id: companyId, nome: companyName });
    
    if (!isValidUUID(companyId)) {
      logDebug("ID da empresa na atualização não é um UUID válido, buscando empresa existente");
      
      const company = await findOrCreateCompanyByName(companyName);
      if (company) {
        companyId = company.id;
        companyName = company.name;
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
          
          logDebug(`Mantendo empresa atual: ${companyId} (${companyName || 'sem nome'})`);
        } else {
          // Fallback para qualquer empresa existente
          const { data: fallbackCompany } = await supabase
            .from('companies')
            .select('id, name')
            .limit(1);
            
          if (fallbackCompany && fallbackCompany.length > 0) {
            companyId = fallbackCompany[0].id;
            companyName = fallbackCompany[0].name;
            logDebug(`Usando empresa de fallback: ${companyId} (${companyName})`);
          } else {
            throw new Error("Não foi possível encontrar uma empresa válida");
          }
        }
      }
    } else if (!companyName) {
      // Se temos um UUID válido, vamos buscar o nome da empresa
      companyName = await getCompanyNameById(companyId);
    }
    
    logDebug(`Atualizando cliente ${clientId} com empresa: ${companyId} (${companyName || 'sem nome'})`);
    
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
      logDebug('Erro ao atualizar cliente no Supabase:', error);
      throw error;
    }
    
    logDebug('Cliente atualizado com sucesso. ID:', clientId);
    return true;
  } catch (error) {
    logDebug('Erro ao atualizar cliente:', error);
    throw error;
  }
};

/**
 * Deletes a client from Supabase
 */
export const deleteSupabaseClient = async (clientId: string) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
      
    if (error) {
      logDebug('Erro ao excluir cliente no Supabase:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    logDebug('Erro ao excluir cliente:', error);
    throw error;
  }
};
