
import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  updateSupabaseClient
} from '../../supabase/client-operations';

/**
 * Update a client in localStorage and Supabase
 * @param client - The client to update
 * @returns Promise<void>
 */
export const updateClient = async (client: Client): Promise<void> => {
  try {
    // Check if company exists - removed dependency on checkSupabaseCompanyExists
    const { data: companyData } = await supabase
      .from('companies')
      .select('id')
      .eq('id', client.companyId)
      .maybeSingle();
    
    if (!companyData) {
      throw new Error(`A empresa com ID ${client.companyId} não existe`);
    }

    // Update in Supabase - pass both id and client data
    console.log('Updating client in Supabase:', client);
    const updatedClient = await updateSupabaseClient(client.id, client);

    if (!updatedClient) {
      throw new Error('Falha ao atualizar cliente no Supabase');
    }

    console.log('Client updated in Supabase:', updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

// Create a hook wrapper for the updateClient function
export const useClientUpdate = () => {
  return { updateClient };
};
