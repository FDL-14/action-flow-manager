
import { useState, useEffect } from 'react';
import { Client } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClientOperations = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        if (data) {
          const formattedClients: Client[] = data.map(client => ({
            id: client.id,
            name: client.name,
            email: client.contact_email || '',
            phone: client.contact_phone || '',
            address: '',
            cnpj: '',
            companyId: client.company_id || '',
            createdAt: new Date(client.created_at),
            updatedAt: new Date(client.updated_at)
          }));
          setClients(formattedClients);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error("Erro ao buscar clientes", { description: "Não foi possível carregar a lista de clientes." });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
    
    // Set up real-time subscription for clients
    const clientsSubscription = supabase
      .channel('clients-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clients' }, 
        fetchClients)
      .subscribe();

    return () => {
      supabase.removeChannel(clientsSubscription);
    };
  }, []);

  const getClientsByCompanyId = (companyId: string): Client[] => {
    return clients.filter(client => client.companyId === companyId);
  };

  const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validate that companyId is not empty
      if (!client.companyId) {
        toast.error("Erro ao adicionar cliente", { description: "É necessário selecionar uma empresa." });
        return null;
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: client.name,
          contact_email: client.email,
          contact_phone: client.phone,
          company_id: client.companyId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newClient: Client = {
        id: data.id,
        name: data.name,
        email: data.contact_email || '',
        phone: data.contact_phone || '',
        address: '',
        cnpj: '',
        companyId: data.company_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setClients([...clients, newClient]);
      toast.success("Cliente adicionado", { description: "Cliente adicionado com sucesso." });
      return newClient;
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast.error("Erro ao adicionar cliente", { description: error.message });
      return null;
    }
  };

  const updateClient = async (client: Client) => {
    try {
      // Validate that companyId is not empty
      if (!client.companyId) {
        toast.error("Erro ao atualizar cliente", { description: "É necessário selecionar uma empresa." });
        return false;
      }
      
      const { error } = await supabase
        .from('clients')
        .update({
          name: client.name,
          contact_email: client.email,
          contact_phone: client.phone,
          company_id: client.companyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (error) {
        throw error;
      }

      setClients(prevClients => prevClients.map(c => c.id === client.id ? {
        ...c,
        ...client,
        updatedAt: new Date()
      } : c));

      toast.success("Cliente atualizado", { description: "Cliente atualizado com sucesso." });
      return true;
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast.error("Erro ao atualizar cliente", { description: error.message });
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      // Check if client exists
      const clientExists = clients.some(client => client.id === id);
      if (!clientExists) {
        toast.error("Erro ao excluir cliente", { description: "Cliente não encontrado." });
        return false;
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setClients(prevClients => prevClients.filter(client => client.id !== id));
      toast.success("Cliente excluído", { description: "Cliente excluído com sucesso." });
      return true;
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error("Erro ao excluir cliente", { description: error.message });
      return false;
    }
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    getClientsByCompanyId
  };
};
