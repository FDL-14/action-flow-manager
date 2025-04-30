
import { Client } from '@/lib/types';
import { toast } from 'sonner';
import { useClientState } from '../use-client-state';
import { 
  fetchSupabaseClients, 
  addSupabaseClient, 
  updateSupabaseClient,
  deleteSupabaseClient,
  checkSupabaseCompanyExists
} from '../use-supabase-clients';

/**
 * Hook for client CRUD operations
 */
export const useClientCrud = () => {
  const { clients, setClients } = useClientState();

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

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!clientData.companyId) {
        toast.error("Erro ao salvar cliente", {
          description: "É necessário selecionar uma empresa para este cliente."
        });
        return null;
      }
      
      console.log("Adicionando cliente com dados:", clientData);
      console.log("Nome da empresa a ser associada:", clientData.companyName);

      // Se estamos lidando com uma string de ID numérico (não-UUID), não verificamos existência
      const isNumericId = /^\d+$/.test(clientData.companyId);
      let companyExists = true;
      
      if (!isNumericId) {
        // Verifica se a empresa existe antes de continuar
        companyExists = await checkSupabaseCompanyExists(clientData.companyId);
      }
      
      if (!companyExists && !clientData.companyName) {
        toast.warning("ID de empresa inválido", {
          description: "O ID da empresa selecionada não é válido e nenhum nome de empresa foi fornecido."
        });
        return null;
      }
      
      const supabaseClient = await addSupabaseClient({ ...clientData });
      
      if (!supabaseClient) {
        throw new Error("Falha ao adicionar cliente no banco de dados");
      }
      
      // Extrair corretamente o nome da empresa
      let companyName = clientData.companyName;
      
      if (supabaseClient.company_name) {
        companyName = supabaseClient.company_name;
      } else if (supabaseClient.companies && typeof supabaseClient.companies === 'object') {
        companyName = supabaseClient.companies.name;
      }
      
      if (!companyName) {
        companyName = 'Empresa não encontrada';
      }
      
      const newClient: Client = {
        id: supabaseClient.id,
        name: supabaseClient.name,
        email: supabaseClient.contact_email || undefined,
        phone: supabaseClient.contact_phone || undefined,
        address: undefined,
        cnpj: undefined,
        companyId: supabaseClient.company_id, 
        companyName: companyName,
        createdAt: new Date(supabaseClient.created_at),
        updatedAt: new Date(supabaseClient.updated_at)
      };
      
      console.log("Cliente adicionado com companyName:", newClient.companyName);
      
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

  const updateClient = async (updatedClient: Client) => {
    try {
      if (!updatedClient.companyId) {
        toast.error("Erro ao atualizar cliente", {
          description: "É necessário selecionar uma empresa para este cliente."
        });
        return false;
      }
      
      console.log("Atualizando cliente:", updatedClient);
      console.log("Nome da empresa associada:", updatedClient.companyName);
      
      // Se estamos lidando com uma string de ID numérico (não-UUID), não verificamos existência
      const isNumericId = /^\d+$/.test(updatedClient.companyId);
      let companyExists = true;
      
      if (!isNumericId) {
        // Verifica se a empresa existe antes de continuar
        companyExists = await checkSupabaseCompanyExists(updatedClient.companyId);
      }
      
      if (!companyExists && !updatedClient.companyName) {
        toast.warning("ID de empresa inválido", {
          description: "O ID da empresa selecionada não é válido e nenhum nome de empresa foi fornecido."
        });
        return false;
      }
      
      await updateSupabaseClient(updatedClient.id, updatedClient);
      
      // Garantir que o nome da empresa é mantido na atualização
      const updatedClients = clients.map(c => 
        c.id === updatedClient.id ? { 
          ...updatedClient, 
          companyName: updatedClient.companyName,
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

  return {
    clients,
    initClients,
    addClient,
    updateClient,
    deleteClient
  };
};
