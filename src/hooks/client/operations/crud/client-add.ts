
import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { addSupabaseClient } from '../../supabase/client-operations';
import { ensureSupabaseCompanyExists } from '../../supabase/company-operations';
import { toast } from 'sonner';

/**
 * Add a client to the local storage and to the Supabase database
 * @param client - The client to add
 * @returns Promise<Client | null> The newly created client or null if failed
 */
export const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> => {
  try {
    console.log('Adding client with data:', client);
    
    if (!client.companyId && !client.companyName) {
      toast.error("Erro ao adicionar cliente", {
        description: "É necessário associar o cliente a uma empresa"
      });
      return null;
    }
    
    // Ensure the company exists in Supabase
    let companyId = client.companyId;
    let companyName = client.companyName;
    
    if (companyId) {
      const companyResult = await ensureSupabaseCompanyExists({
        id: companyId,
        name: companyName || 'Empresa'
      });
      
      if (!companyResult) {
        toast.error("Erro ao adicionar cliente", {
          description: "Não foi possível verificar ou criar a empresa associada"
        });
        return null;
      }
      
      companyId = companyResult;
    }

    // Add the client to Supabase
    console.log('Adding client to Supabase:', { ...client, companyId });
    const newClient = await addSupabaseClient({
      ...client,
      companyId
    });

    if (!newClient) {
      throw new Error('Falha ao adicionar cliente no Supabase');
    }

    console.log('Client added to Supabase:', newClient);
    
    const createdClient: Client = {
      id: newClient.id,
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      cnpj: client.cnpj || '',
      companyId: newClient.company_id || '',
      companyName: newClient.company_name || companyName || '',
      createdAt: new Date(newClient.created_at),
      updatedAt: new Date(newClient.updated_at)
    };
    
    toast.success("Cliente adicionado com sucesso", {
      description: `O cliente "${client.name}" foi cadastrado com sucesso.`
    });
    
    return createdClient;
  } catch (error) {
    console.error('Error adding client:', error);
    toast.error("Erro ao adicionar cliente", {
      description: error instanceof Error ? error.message : "Ocorreu um erro inesperado"
    });
    return null;
  }
};

// Create a hook wrapper for the addClient function
export const useClientAdd = () => {
  return { addClient };
};
