
import { Client } from '@/lib/types';
import { supabase, convertToUUID } from '@/integrations/supabase/client';
import { 
  addSupabaseClient
} from '../../supabase/client-operations';

/**
 * Add a client to the local storage and to the Supabase database
 * @param client - The client to add
 * @returns Promise<string> The ID of the new client
 */
export const addClient = async (client: Omit<Client, 'id'>): Promise<string> => {
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

    // Add to Supabase first to get a reliable ID
    console.log('Adding client to Supabase:', client);
    const newClient = await addSupabaseClient({
      ...client,
      id: '',
    });

    if (!newClient) {
      throw new Error('Falha ao adicionar cliente no Supabase');
    }

    console.log('Client added to Supabase:', newClient);
    return newClient.id;
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
};

// Create a hook wrapper for the addClient function
export const useClientAdd = () => {
  return { addClient };
};
