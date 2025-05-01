
import { supabase, convertToUUID, retryOperation } from '@/integrations/supabase/client';
import { Client } from '@/lib/types';
import { isValidUUID, logDebug } from './utils';
import { findOrCreateCompanyByName, getCompanyNameById, checkSupabaseCompanyExists, ensureSupabaseCompanyExists } from './company-operations';

/**
 * Fetches all clients from Supabase with their associated companies
 */
export const fetchSupabaseClients = async () => {
  try {
    logDebug("Iniciando busca de clientes no Supabase...");
    
    // Modified to include the join with companies table
    const { data, error } = await retryOperation(
      () => supabase
        .from('clients')
        .select('*, companies(name)')
        .order('name', { ascending: true }),
      3,
      500,
      'Fetch clients'
    );
      
    if (error) {
      logDebug("Erro ao buscar clientes do Supabase:", error);
      return null;
    }
    
    if (data && data.length > 0) {
      logDebug(`${data.length} clientes encontrados no Supabase`);
      
      const clients = await Promise.all(data.map(async c => {
        // Extrair o nome da empresa do join, se disponível
        let companyName;
        
        if (c.companies) {
          // Check if companies is an object (not an array) and has name property
          if (typeof c.companies === 'object' && !Array.isArray(c.companies) && c.companies.name) {
            companyName = c.companies.name;
          }
        }
        
        // If company name is still not found, try to fetch it directly
        if (!companyName && c.company_id) {
          companyName = await getCompanyNameById(c.company_id);
        }
        
        logDebug(`Cliente carregado: ${c.name}, Empresa: ${companyName || 'não definida'}`);
        
        return {
          id: c.id,
          name: c.name,
          email: c.contact_email || undefined,
          phone: c.contact_phone || undefined,
          address: c.address || undefined,
          cnpj: c.cnpj || undefined,
          companyId: c.company_id || '',
          companyName: companyName || 'Empresa não especificada', 
          createdAt: new Date(c.created_at || new Date()),
          updatedAt: new Date(c.updated_at || new Date())
        };
      }));
      
      return clients;
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
    if (!clientData.companyId && !clientData.companyName) {
      throw new Error("É necessário fornecer uma empresa (ID ou nome)");
    }
    
    let companyId = clientData.companyId;
    let companyName = clientData.companyName;
    
    logDebug("Adicionando cliente para empresa:", { id: companyId, nome: companyName });
    
    // If we only have company name but no ID, find or create it
    if (!companyId && companyName) {
      logDebug(`Buscando ou criando empresa pelo nome: ${companyName}`);
      const companyResult = await findOrCreateCompanyByName(companyName);
      
      if (companyResult) {
        companyId = companyResult.id;
        companyName = companyResult.name;
        logDebug(`Empresa encontrada/criada: ${companyId} (${companyName})`);
      } else {
        throw new Error("Não foi possível encontrar ou criar a empresa especificada");
      }
    } else {
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
    }
    
    logDebug(`Salvando cliente com empresa: ${companyId} (${companyName || 'sem nome'})`);
    
    const { data: supabaseClient, error } = await retryOperation(
      () => supabase
        .from('clients')
        .insert({
          name: clientData.name,
          contact_email: clientData.email || null,
          contact_phone: clientData.phone || null,
          contact_name: clientData.name,
          company_id: companyId,
          address: clientData.address || null,
          cnpj: clientData.cnpj || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*, companies(name)')
        .single(),
      3,
      500,
      'Add client'
    );
      
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
    if (!clientData.companyId && !clientData.companyName) {
      throw new Error("É necessário fornecer uma empresa (ID ou nome)");
    }
    
    let companyId = clientData.companyId;
    let companyName = clientData.companyName;
    
    logDebug("Atualizando cliente com dados de empresa:", { id: companyId, nome: companyName });
    
    // If we only have company name but no ID, find or create it
    if (!companyId && companyName) {
      logDebug(`Buscando ou criando empresa pelo nome: ${companyName}`);
      const companyResult = await findOrCreateCompanyByName(companyName);
      
      if (companyResult) {
        companyId = companyResult.id;
        companyName = companyResult.name;
        logDebug(`Empresa encontrada/criada: ${companyId} (${companyName})`);
      } else {
        throw new Error("Não foi possível encontrar ou criar a empresa especificada");
      }
    } else {
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
    }
    
    logDebug(`Atualizando cliente ${clientId} com empresa: ${companyId} (${companyName || 'sem nome'})`);
    
    const { error } = await retryOperation(
      () => supabase
        .from('clients')
        .update({
          name: clientData.name,
          contact_email: clientData.email || null,
          contact_phone: clientData.phone || null,
          contact_name: clientData.name,
          company_id: companyId,
          address: clientData.address || null,
          cnpj: clientData.cnpj || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId),
      3,
      500,
      'Update client'
    );
      
    if (error) {
      logDebug('Erro ao atualizar cliente no Supabase:', error);
      throw error;
    }
    
    logDebug('Cliente atualizado com sucesso. ID:', clientId);
    return {
      success: true,
      companyId: companyId,
      companyName: companyName
    };
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
    const { error } = await retryOperation(
      () => supabase
        .from('clients')
        .delete()
        .eq('id', clientId),
      3,
      500,
      'Delete client'
    );
      
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

/**
 * Synchronizes the client with Supabase
 * Used during application initialization to ensure all local clients are in Supabase
 */
export const syncClientWithSupabase = async (client: Client) => {
  try {
    // First, check if the client exists in Supabase
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client.id)
      .maybeSingle();
      
    if (error) {
      logDebug(`Erro ao verificar cliente ${client.id}:`, error);
      return false;
    }
    
    if (!data) {
      // Client doesn't exist, create it
      logDebug(`Cliente ${client.id} não encontrado no Supabase, criando...`);
      await addSupabaseClient({
        ...client,
        id: client.id
      });
    } else {
      // Client exists, update it
      logDebug(`Cliente ${client.id} encontrado no Supabase, atualizando...`);
      await updateSupabaseClient(client.id, client);
    }
    
    return true;
  } catch (error) {
    logDebug(`Erro ao sincronizar cliente ${client.id}:`, error);
    return false;
  }
};
