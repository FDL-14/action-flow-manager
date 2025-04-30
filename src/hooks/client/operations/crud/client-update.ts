
import { Client } from '@/lib/types';
import { toast } from 'sonner';
import { useClientState } from '../../use-client-state';
import { 
  updateSupabaseClient,
  checkSupabaseCompanyExists
} from '../../use-supabase-clients';

/**
 * Hook for updating a client
 */
export const useClientUpdate = () => {
  const { clients, setClients } = useClientState();

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

  return { updateClient };
};
