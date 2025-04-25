
import { useState, useEffect } from 'react';
import { Client } from '@/lib/types';
import { toast } from 'sonner';

export const useClientState = () => {
  const [clients, setClients] = useState<Client[]>([]);

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

  return {
    clients,
    setClients
  };
};
