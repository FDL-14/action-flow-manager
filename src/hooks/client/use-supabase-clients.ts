
// Re-export all supabase client operations from their respective modules
export { 
  fetchSupabaseClients, 
  addSupabaseClient, 
  updateSupabaseClient,
  deleteSupabaseClient 
} from './supabase/client-operations';

export {
  checkSupabaseCompanyExists,
  ensureSupabaseCompanyExists,
  findOrCreateCompanyByName,
  getCompanyNameById
} from './supabase/company-operations';

export { isValidUUID } from './supabase/utils';
