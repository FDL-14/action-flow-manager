
import { supabase } from '@/integrations/supabase/client';
import {
  fetchSupabaseClients as getAllClients,
  addSupabaseClient,
  updateSupabaseClient,
  deleteSupabaseClient,
  syncClientWithSupabase
} from './supabase/client-operations';

import {
  ensureSupabaseCompanyExists,
  findOrCreateCompanyByName,
  getCompanyNameById,
  fetchAllCompanies
} from './supabase/company-operations';

// Define the getClientById function that was missing
const getClientById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*, companies(name)')
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching client by ID:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      email: data.contact_email || undefined,
      phone: data.contact_phone || undefined,
      address: data.address || undefined,
      cnpj: data.cnpj || undefined,
      companyId: data.company_id || '',
      companyName: data.companies?.name || 'Empresa não especificada', 
      createdAt: new Date(data.created_at || new Date()),
      updatedAt: new Date(data.updated_at || new Date())
    };
  } catch (error) {
    console.error('Error in getClientById:', error);
    return null;
  }
};

// Export Supabase client operations with appropriate names
export {
  // Client operations
  addSupabaseClient,
  getAllClients,
  updateSupabaseClient,
  deleteSupabaseClient,
  syncClientWithSupabase,
  getClientById,
  
  // Company operations
  ensureSupabaseCompanyExists,
  findOrCreateCompanyByName,
  getCompanyNameById,
  fetchAllCompanies as getCompanies
};

export const fetchSupabaseClients = async () => {
  try {
    console.log("Buscando clientes do Supabase...");
    const clients = await getAllClients();
    console.log(`Clientes retornados: ${clients?.length || 0}`);
    return clients;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
};
