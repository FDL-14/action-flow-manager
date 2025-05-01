
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
  checkSupabaseCompanyExists,
  fetchAllCompanies as getCompanies
} from './supabase/company-operations';

// Export Supabase client operations with appropriate names
export {
  // Client operations
  addSupabaseClient,
  getAllClients,
  updateSupabaseClient,
  deleteSupabaseClient,
  syncClientWithSupabase,
  
  // Company operations
  ensureSupabaseCompanyExists as addCompany,
  findOrCreateCompanyByName,
  getCompanyNameById as getCompanyById,
  checkSupabaseCompanyExists,
  getCompanyNameById as getCompanyByName,
  getCompanies,
  // Placeholder export for functions not implemented yet
  ensureSupabaseCompanyExists as updateCompany,
  checkSupabaseCompanyExists as deleteCompany
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
