
import { useEffect } from 'react';
import { useClientState } from '../../use-client-state';
import { fetchSupabaseClients } from '../../use-supabase-clients';
import { toast } from 'sonner';

/**
 * Hook for initializing clients data
 */
export const useClientInit = () => {
  const { setClients } = useClientState();

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
      toast.error("Erro ao carregar clientes", {
        description: "Não foi possível carregar os clientes. Por favor, recarregue a página."
      });
    }
  };

  // Effect to initialize clients
  useEffect(() => {
    initClients();
  }, []);

  return { initClients };
};
