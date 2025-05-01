
import { supabase } from '@/integrations/supabase/client';
import {
  fetchSupabaseClients as getAllClients,
  addSupabaseClient,
  updateSupabaseClient,
  deleteSupabaseClient,
  syncClientWithSupabase,
  getClientById
} from './supabase/client-operations';

import {
  ensureSupabaseCompanyExists,
  findOrCreateCompanyByName,
  getCompanyNameById,
  checkSupabaseCompanyExists,
  fetchAllCompanies
} from './supabase/company-operations';

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
  checkSupabaseCompanyExists,
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
