
import { Client } from '@/lib/types';
import { toast } from 'sonner';
import { useClientState } from '../../use-client-state';
import { 
  addSupabaseClient,
  checkSupabaseCompanyExists
} from '../../use-supabase-clients';

/**
 * Hook for adding a client
 */
export const useClientAdd = () => {
  const { clients, setClients } = useClientState();

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

  return { addClient };
};
