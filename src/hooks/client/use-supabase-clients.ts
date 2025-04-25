
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

export const addSupabaseClient = async (clientData: any) => {
  const { data: supabaseClient, error } = await supabase
    .from('clients')
    .insert({
      name: clientData.name,
      contact_email: clientData.email || null,
      contact_phone: clientData.phone || null,
      contact_name: clientData.name,
      company_id: clientData.companyId
    })
    .select('*')
    .single();
    
  if (error) {
    console.error('Erro ao salvar cliente no Supabase:', error);
    throw error;
  }
  
  return supabaseClient;
};

export const updateSupabaseClient = async (clientId: string, clientData: any) => {
  const { error } = await supabase
    .from('clients')
    .update({
      name: clientData.name,
      contact_email: clientData.email || null,
      contact_phone: clientData.phone || null,
      contact_name: clientData.name,
      company_id: clientData.companyId
    })
    .eq('id', clientId);
    
  if (error) {
    console.error('Erro ao atualizar cliente no Supabase:', error);
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
