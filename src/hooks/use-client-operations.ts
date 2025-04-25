
import { useState, useEffect } from 'react';
import { Client } from '@/lib/types';
import { toast } from 'sonner';
import { supabase, convertToUUID } from '@/integrations/supabase/client';

export const useClientOperations = () => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*');
          
        if (error) {
          console.error("Erro ao buscar clientes do Supabase:", error);
          
          const storedClients = localStorage.getItem('clients');
          if (storedClients) {
            const parsedClients = JSON.parse(storedClients);
            console.log("Clientes carregados do localStorage:", parsedClients);
            setClients(parsedClients);
          }
        } else if (data && data.length > 0) {
          const formattedClients = data.map(c => ({
            id: c.id,
            name: c.name,
            email: c.contact_email || undefined,
            phone: c.contact_phone || undefined,
            address: undefined,
            cnpj: undefined,
            companyId: c.company_id || '',
            createdAt: new Date(c.created_at || new Date()),
            updatedAt: new Date(c.updated_at || new Date())
          }));
          
          console.log("Clientes carregados do Supabase:", formattedClients);
          setClients(formattedClients);
        } else {
          const storedClients = localStorage.getItem('clients');
          if (storedClients) {
            const parsedClients = JSON.parse(storedClients);
            console.log("Nenhum cliente no Supabase, carregando do localStorage:", parsedClients);
            setClients(parsedClients);
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar clientes:", error);
      }
    };
    
    fetchClients();
  }, []);

  useEffect(() => {
    try {
      if (clients && clients.length > 0) {
        localStorage.setItem('clients', JSON.stringify(clients));
      }
    } catch (error) {
      console.error("Error saving clients:", error);
      toast.error("Erro ao salvar clientes localmente");
    }
  }, [clients]);

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!clientData.companyId) {
      toast.error("Erro ao salvar cliente", {
        description: "É necessário selecionar uma empresa para este cliente."
      });
      return;
    }
    
    try {
      console.log("Adicionando cliente com dados:", clientData);
      
      const originalCompanyId = clientData.companyId;
      const companyId = convertToUUID(clientData.companyId);
      
      const supabaseClientData = {
        name: clientData.name,
        contact_email: clientData.email || null,
        contact_phone: clientData.phone || null,
        contact_name: clientData.name,
        company_id: companyId
      };
      
      const { data: supabaseClient, error } = await supabase
        .from('clients')
        .insert(supabaseClientData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Erro ao salvar cliente no Supabase:', error);
        throw error;
      }
      
      const newClient: Client = {
        id: supabaseClient.id,
        name: supabaseClient.name,
        email: supabaseClient.contact_email || undefined,
        phone: supabaseClient.contact_phone || undefined,
        address: undefined,
        cnpj: undefined,
        companyId: originalCompanyId,
        createdAt: new Date(supabaseClient.created_at),
        updatedAt: new Date(supabaseClient.updated_at)
      };
      
      setClients(prev => [...prev, newClient]);
      toast.success("Cliente adicionado com sucesso");
      return newClient;
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      toast.error("Erro ao salvar cliente", {
        description: "Não foi possível salvar o cliente. Por favor, tente novamente."
      });
      throw error;
    }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      if (!updatedClient.companyId) {
        toast.error("Erro ao atualizar cliente", {
          description: "É necessário selecionar uma empresa para este cliente."
        });
        return;
      }
      
      const originalCompanyId = updatedClient.companyId;
      const companyId = convertToUUID(updatedClient.companyId);
      
      const supabaseClientData = {
        name: updatedClient.name,
        contact_email: updatedClient.email || null,
        contact_phone: updatedClient.phone || null,
        contact_name: updatedClient.name,
        company_id: companyId
      };
      
      const { error } = await supabase
        .from('clients')
        .update(supabaseClientData)
        .eq('id', updatedClient.id);
      
      if (error) {
        console.error('Erro ao atualizar cliente no Supabase:', error);
        throw error;
      }
      
      const updatedClients = clients.map(c => 
        c.id === updatedClient.id ? { 
          ...updatedClient, 
          companyId: originalCompanyId,
          updatedAt: new Date() 
        } : c
      );
      
      setClients(updatedClients);
      toast.success("Cliente atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente", {
        description: "Não foi possível atualizar o cliente. Por favor, tente novamente."
      });
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir cliente no Supabase:', error);
        throw error;
      }
      
      setClients(clients.filter(c => c.id !== id));
      toast.success("Cliente excluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente", {
        description: "Não foi possível excluir o cliente. Por favor, tente novamente."
      });
    }
  };

  const getClientsByCompanyId = (companyId: string): Client[] => {
    if (!companyId) {
      console.warn("getClientsByCompanyId: nenhum ID de empresa fornecido");
      return [];
    }
    
    if (companyId === 'all') {
      return clients;
    }
    
    console.log("Buscando clientes para a empresa:", companyId);
    console.log("Total de clientes disponíveis:", clients.length);
    
    const filteredClients = clients.filter(client => {
      const result = client.companyId === companyId;
      console.log(`Cliente ${client.name}: companyId=${client.companyId}, target=${companyId}, match=${result}`);
      return result;
    });
    
    console.log("Clientes filtrados para a empresa:", filteredClients);
    return filteredClients;
  };

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientsByCompanyId
  };
};
