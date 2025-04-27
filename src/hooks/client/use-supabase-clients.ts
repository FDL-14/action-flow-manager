
import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

export const fetchSupabaseClients = async () => {
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
  
  return null;
};

// Função para verificar se uma empresa existe no Supabase antes de usar
export const checkSupabaseCompanyExists = async (companyId: string) => {
  console.log("Verificando se empresa existe no Supabase:", companyId);
  
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();
    
    if (error) {
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
    // Garante que a empresa existe antes de vincular o cliente
    const companyId = await ensureSupabaseCompanyExists({
      id: clientData.companyId,
      name: "Empresa Sincronizada"
    });
    
    if (!companyId) {
      throw new Error("Não foi possível garantir a existência da empresa");
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
    // Garante que a empresa existe antes de vincular o cliente
    const companyId = await ensureSupabaseCompanyExists({
      id: clientData.companyId,
      name: "Empresa Sincronizada"
    });
    
    if (!companyId) {
      throw new Error("Não foi possível garantir a existência da empresa");
    }
    
    const { error } = await supabase
      .from('clients')
      .update({
        name: clientData.name,
        contact_email: clientData.email || null,
        contact_phone: clientData.phone || null,
        contact_name: clientData.name,
        company_id: companyId
      })
      .eq('id', clientId);
      
    if (error) {
      console.error('Erro ao atualizar cliente no Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    throw error;
  }
};

export const deleteSupabaseClient = async (clientId: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);
    
  if (error) {
    console.error('Erro ao excluir cliente no Supabase:', error);
    throw error;
  }
};
