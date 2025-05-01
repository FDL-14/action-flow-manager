
import { supabase } from '@/integrations/supabase/client';
import { 
  deleteSupabaseClient 
} from '../../use-supabase-clients';

/**
 * Delete a client from localStorage and Supabase
 * @param id - The ID of the client to delete
 * @returns Promise<void>
 */
export const deleteClient = async (id: string): Promise<void> => {
  try {
    // Delete from Supabase
    console.log('Deleting client from Supabase:', id);
    await deleteSupabaseClient(id);

    console.log('Client deleted from Supabase:', id);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};
