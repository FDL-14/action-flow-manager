
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
    
    // Fetch clients with a more direct approach
    const { data, error } = await supabase
      .from('clients')
      .select('*, companies(name)')
      .order('name', { ascending: true });
      
    if (error) {
      logDebug("Erro ao buscar clientes do Supabase:", error);
      return null;
    }
    
    if (data && data.length > 0) {
      logDebug(`${data.length} clientes encontrados no Supabase`);
      
      const clients = await Promise.all(data.map(async c => {
        // Get company name either from join or direct fetch
        let companyName;
        
        if (c.companies && typeof c.companies === 'object' && c.companies.name) {
          companyName = c.companies.name;
          logDebug(`Nome da empresa extraído do join: ${companyName}`);
        } 
        else if (c.company_id) {
          companyName = await getCompanyNameById(c.company_id);
          logDebug(`Nome da empresa buscado diretamente: ${companyName}`);
        }
        
        logDebug(`Cliente carregado: ${c.name}, Empresa: ${companyName || 'não definida'}, ID: ${c.id}, CompanyID: ${c.company_id}`);
        
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
      
      logDebug(`Processados ${clients.length} clientes`);
      return clients;
    }
    
    logDebug("Nenhum cliente encontrado no Supabase");
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
      async () => await supabase
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
      async () => await supabase
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
      async () => await supabase
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
      
      // Make sure we have valid company data
      if (!client.companyId) {
        logDebug(`Cliente ${client.id} não tem companyId definido, usando padrão`);
        if (client.companyName) {
          const companyResult = await findOrCreateCompanyByName(client.companyName);
          if (companyResult) {
            client.companyId = companyResult.id;
            logDebug(`Empresa criada/encontrada com ID: ${client.companyId}`);
          }
        }
      }
      
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
