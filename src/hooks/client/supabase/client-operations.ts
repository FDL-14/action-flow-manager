
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/lib/types';
import { isValidUUID, logDebug } from './utils';
import { findOrCreateCompanyByName, getCompanyNameById, checkSupabaseCompanyExists, ensureSupabaseCompanyExists } from './company-operations';

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
    
    let companyId = clientData.companyId;
    let companyName = clientData.companyName;
    
    logDebug("Adicionando cliente para empresa:", { id: companyId, nome: companyName });
    
    // Garantir que a empresa exista no Supabase antes de continuar
    const companyResult = await ensureSupabaseCompanyExists({
      id: companyId,
      name: companyName || 'Empresa sem nome'
    });
    
    if (!companyResult) {
      throw new Error("Falha ao garantir que a empresa exista no Supabase");
    }
    
    companyId = companyResult;
    
    // Verificar se temos o nome da empresa
    if (!companyName) {
      companyName = await getCompanyNameById(companyId);
    }
    
    const { data: supabaseClient, error } = await supabase
      .from('clients')
      .insert({
        name: clientData.name,
        contact_email: clientData.email || null,
        contact_phone: clientData.phone || null,
        contact_name: clientData.name,
        company_id: companyId
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
    
    let companyId = clientData.companyId;
    let companyName = clientData.companyName;
    
    logDebug("Atualizando cliente com dados de empresa:", { id: companyId, nome: companyName });
    
    // Garantir que a empresa exista no Supabase antes de continuar
    const companyResult = await ensureSupabaseCompanyExists({
      id: companyId,
      name: companyName || 'Empresa sem nome'
    });
    
    if (!companyResult) {
      throw new Error("Falha ao garantir que a empresa exista no Supabase");
    }
    
    companyId = companyResult;
    
    // Verificar se temos o nome da empresa
    if (!companyName) {
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
