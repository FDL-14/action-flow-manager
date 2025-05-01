
import { useEffect } from 'react';
import { useClientState } from '../../use-client-state';
import { fetchSupabaseClients, syncClientWithSupabase } from '@/hooks/client/use-supabase-clients';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for initializing clients data
 */
export const useClientInit = () => {
  const { setClients, clients } = useClientState();
  const { syncWithSupabase } = useAuth();

  const initClients = async () => {
    try {
      console.log("Inicializando clientes...");
      
      // First try to sync user data
      await syncWithSupabase();
      
      // Add realtime subscription to clients table
      const clientsSubscription = supabase
        .channel('public:clients')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'clients' 
        }, (payload) => {
          console.log('Alteração na tabela clients detectada:', payload);
          refreshClients();
        })
        .subscribe();
        
      // To clean up on unmount
      window.addEventListener('beforeunload', () => {
        supabase.removeChannel(clientsSubscription);
      });
      
      await refreshClients();
    } catch (error) {
      console.error("Erro ao inicializar clientes:", error);
      toast.error("Erro ao carregar clientes", {
        description: "Não foi possível carregar os clientes. Por favor, recarregue a página."
      });
    }
  };
  
  const refreshClients = async () => {
    console.log("Buscando clientes do Supabase...");
    const supabaseClients = await fetchSupabaseClients();
    
    if (!supabaseClients || supabaseClients.length === 0) {
      console.log("Nenhum cliente encontrado no Supabase, verificando localStorage...");
      const storedClients = localStorage.getItem('clients');
      if (storedClients) {
        const parsedClients = JSON.parse(storedClients);
        console.log("Clientes carregados do localStorage:", parsedClients.length);
        setClients(parsedClients);
        
        // Try to sync localStorage clients to Supabase
        console.log("Sincronizando clientes do localStorage para o Supabase...");
        for (const client of parsedClients) {
          await syncClientWithSupabase(client);
        }
        
        // Tentar buscar novamente do Supabase após sincronização
        const updatedClients = await fetchSupabaseClients();
        if (updatedClients && updatedClients.length > 0) {
          console.log("Clientes atualizados do Supabase após sincronização:", updatedClients.length);
          setClients(updatedClients);
        }
      } else {
        // Initialize with empty array instead of defaulting to mock data
        setClients([]);
      }
      return;
    }
    
    console.log("Clientes carregados do Supabase:", supabaseClients.length);
    // Log each client with its company ID to verify data integrity
    supabaseClients.forEach(client => {
      console.log(`Cliente: ${client.name}, Empresa: ${client.companyName || 'N/A'}, CompanyID: ${client.companyId || 'N/A'}`);
    });
    
    setClients(supabaseClients);
    
    // Also update localStorage for offline backup
    localStorage.setItem('clients', JSON.stringify(supabaseClients));
  };

  // Effect to initialize clients
  useEffect(() => {
    initClients();
  }, []);

  return { initClients, refreshClients };
};
