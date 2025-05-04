
import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { updateSupabaseClient } from '../../supabase/client-operations';
import { ensureSupabaseCompanyExists } from '../../supabase/company-operations';
import { toast } from 'sonner';

/**
 * Update a client in localStorage and Supabase
 * @param client - The client to update
 * @returns Promise<boolean> - Success status
 */
export const updateClient = async (client: Client): Promise<boolean> => {
  try {
    console.log('Updating client:', client);
    
    if (!client.companyId && !client.companyName) {
      toast.error("Erro ao atualizar cliente", {
        description: "É necessário associar o cliente a uma empresa"
      });
      return false;
    }
    
    // Ensure the company exists in Supabase before updating the client
    let finalCompanyId = client.companyId;
    
    // Try to ensure the company exists in Supabase
    const companyId = await ensureSupabaseCompanyExists({
      id: client.companyId,
      name: client.companyName || 'Empresa'
    });
    
    if (!companyId) {
      console.error(`Não foi possível garantir que a empresa ${client.companyName} existe no banco de dados`);
      toast.error("Erro ao atualizar cliente", {
        description: "Não foi possível verificar ou criar a empresa associada"
      });
      return false;
    }
    
    // Use the returned company ID (might be different if it was created)
    finalCompanyId = companyId;
    console.log(`Empresa garantida com ID: ${finalCompanyId}`);
    
    // Update client in Supabase with the guaranteed company ID
    console.log('Atualizando cliente no Supabase:', { ...client, companyId: finalCompanyId });
    const result = await updateSupabaseClient(client.id, {
      ...client,
      companyId: finalCompanyId
    });

    if (!result) {
      throw new Error('Falha ao atualizar cliente no Supabase');
    }

    console.log('Cliente atualizado no Supabase:', result);
    
    toast.success("Cliente atualizado com sucesso", {
      description: `As informações do cliente "${client.name}" foram atualizadas.`
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    toast.error("Erro ao atualizar cliente", {
      description: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
    });
    return false;
  }
};

// Create a hook wrapper for the updateClient function
export const useClientUpdate = () => {
  return { updateClient };
};
