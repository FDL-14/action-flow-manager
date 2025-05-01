
import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  updateSupabaseClient,
  checkSupabaseCompanyExists 
} from '../../use-supabase-clients';

/**
 * Update a client in localStorage and Supabase
 * @param client - The client to update
 * @returns Promise<void>
 */
export const updateClient = async (client: Client): Promise<void> => {
  try {
    // Check if company exists
    const companyExists = await checkSupabaseCompanyExists(client.companyId);
    
    if (!companyExists) {
      throw new Error(`A empresa com ID ${client.companyId} não existe`);
    }

    // Update in Supabase
    console.log('Updating client in Supabase:', client);
    const updatedClient = await updateSupabaseClient(client);

    if (!updatedClient) {
      throw new Error('Falha ao atualizar cliente no Supabase');
    }

    console.log('Client updated in Supabase:', updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};
