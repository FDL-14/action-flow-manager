
import { toast } from 'sonner';
import { useClientState } from '../../use-client-state';
import { deleteSupabaseClient } from '../../use-supabase-clients';

/**
 * Hook for deleting a client
 */
export const useClientDelete = () => {
  const { clients, setClients } = useClientState();

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

  return { deleteClient };
};
