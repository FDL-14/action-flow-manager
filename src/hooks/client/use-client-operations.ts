
import { useEffect } from 'react';
import { Client } from '@/lib/types';
import { toast } from 'sonner';
import { useClientState } from './use-client-state';
import { 
  fetchSupabaseClients, 
  addSupabaseClient, 
  updateSupabaseClient,
  deleteSupabaseClient,
  checkSupabaseCompanyExists
} from './use-supabase-clients';

export const useClientOperations = () => {
  const { clients, setClients } = useClientState();

  useEffect(() => {
    const initClients = async () => {
      try {
        const supabaseClients = await fetchSupabaseClients();
        
        if (!supabaseClients) {
          const storedClients = localStorage.getItem('clients');
          if (storedClients) {
            const parsedClients = JSON.parse(storedClients);
            console.log("Clientes carregados do localStorage:", parsedClients);
            setClients(parsedClients);
          }
          return;
        }
        
        console.log("Clientes carregados do Supabase:", supabaseClients);
        setClients(supabaseClients);
      } catch (error) {
        console.error("Erro ao inicializar clientes:", error);
      }
    };
    
    initClients();
  }, [setClients]);

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & { companyName?: string }) => {
    try {
      if (!clientData.companyId) {
        toast.error("Erro ao salvar cliente", {
          description: "É necessário selecionar uma empresa para este cliente."
        });
        return null;
      }
      
      console.log("Adicionando cliente com dados:", clientData);

      // Se estamos lidando com uma string de ID numérico (não-UUID), não verificamos existência
      const isNumericId = /^\d+$/.test(clientData.companyId);
      let companyExists = true;
      
      if (!isNumericId) {
        // Verifica se a empresa existe antes de continuar
        companyExists = await checkSupabaseCompanyExists(clientData.companyId);
      }
      
      if (!companyExists) {
        toast.warning("ID de empresa inválido", {
          description: "O ID da empresa selecionada não é válido. Tentando usar o nome da empresa."
        });
      }
      
      const supabaseClient = await addSupabaseClient({ ...clientData });
      
      if (!supabaseClient) {
        throw new Error("Falha ao adicionar cliente no banco de dados");
      }
      
      const newClient: Client = {
        id: supabaseClient.id,
        name: supabaseClient.name,
        email: supabaseClient.contact_email || undefined,
        phone: supabaseClient.contact_phone || undefined,
        address: undefined,
        cnpj: undefined,
        companyId: supabaseClient.company_id, // Use o ID retornado do Supabase
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
      return null;
    }
  };

  const updateClient = async (updatedClient: Client & { companyName?: string }) => {
    try {
      if (!updatedClient.companyId) {
        toast.error("Erro ao atualizar cliente", {
          description: "É necessário selecionar uma empresa para este cliente."
        });
        return false;
      }
      
      // Se estamos lidando com uma string de ID numérico (não-UUID), não verificamos existência
      const isNumericId = /^\d+$/.test(updatedClient.companyId);
      let companyExists = true;
      
      if (!isNumericId) {
        // Verifica se a empresa existe antes de continuar
        companyExists = await checkSupabaseCompanyExists(updatedClient.companyId);
      }
      
      if (!companyExists) {
        toast.warning("ID de empresa inválido", {
          description: "O ID da empresa selecionada não é válido. Tentando usar o nome da empresa."
        });
      }
      
      await updateSupabaseClient(updatedClient.id, updatedClient);
      
      const updatedClients = clients.map(c => 
        c.id === updatedClient.id ? { 
          ...updatedClient, 
          updatedAt: new Date() 
        } : c
      );
      
      setClients(updatedClients);
      toast.success("Cliente atualizado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente", {
        description: "Não foi possível atualizar o cliente. Por favor, tente novamente."
      });
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await deleteSupabaseClient(id);
      setClients(clients.filter(c => c.id !== id));
      toast.success("Cliente excluído com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente", {
        description: "Não foi possível excluir o cliente. Por favor, tente novamente."
      });
      return false;
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
