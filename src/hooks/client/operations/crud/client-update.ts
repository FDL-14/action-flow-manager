
import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  updateSupabaseClient
} from '../../supabase/client-operations';
import { toast } from 'sonner';

/**
 * Update a client in localStorage and Supabase
 * @param client - The client to update
 * @returns Promise<boolean> - Success status
 */
export const updateClient = async (client: Client): Promise<boolean> => {
  try {
    if (!client.companyId) {
      throw new Error('É necessário informar uma empresa para o cliente');
    }
    
    // Check if company exists
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', client.companyId)
      .maybeSingle();
    
    if (companyError) {
      console.error('Erro ao verificar empresa:', companyError);
      toast.error('Erro ao atualizar cliente', {
        description: 'Não foi possível verificar a empresa associada.'
      });
      return false;
    }
    
    if (!companyData) {
      console.warn(`A empresa com ID ${client.companyId} não existe no banco de dados. Tentando criar...`);
      
      // Try to create the company if it doesn't exist
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          id: client.companyId,
          name: client.companyName || 'Empresa sem nome',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Erro ao criar empresa:', createError);
        toast.error('Erro ao atualizar cliente', {
          description: 'Não foi possível criar a empresa associada.'
        });
        return false;
      }
      
      console.log('Empresa criada com sucesso:', newCompany);
    } else {
      console.log('Empresa encontrada:', companyData);
      // If company exists but the name is different, update it
      if (client.companyName && client.companyName !== companyData.name) {
        console.log(`Atualizando nome da empresa de "${companyData.name}" para "${client.companyName}"`);
        
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            name: client.companyName,
            updated_at: new Date().toISOString()
          })
          .eq('id', client.companyId);
          
        if (updateError) {
          console.warn('Erro ao atualizar nome da empresa:', updateError);
          // Non-critical error, continue
        }
      }
    }

    // Update client in Supabase
    console.log('Atualizando cliente no Supabase:', client);
    const result = await updateSupabaseClient(client.id, client);

    if (!result) {
      throw new Error('Falha ao atualizar cliente no Supabase');
    }

    console.log('Cliente atualizado no Supabase:', result);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    throw error;
  }
};

// Create a hook wrapper for the updateClient function
export const useClientUpdate = () => {
  return { updateClient };
};
