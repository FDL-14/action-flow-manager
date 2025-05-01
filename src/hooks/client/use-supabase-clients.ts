
import {
  addClient,
  getAllClients,
  updateClient,
  deleteClient,
  getClientById,
  syncClientWithSupabase
} from './supabase/client-operations';

import {
  addCompany,
  updateCompany,
  deleteCompany,
  getCompanies,
  getCompanyByName,
  getCompanyById
} from './supabase/company-operations';

export {
  // Client operations
  addClient,
  getAllClients,
  updateClient,
  deleteClient,
  getClientById,
  syncClientWithSupabase,
  
  // Company operations
  addCompany,
  updateCompany,
  deleteCompany,
  getCompanies,
  getCompanyByName,
  getCompanyById
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
