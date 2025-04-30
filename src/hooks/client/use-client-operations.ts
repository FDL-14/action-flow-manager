
import { useEffect } from 'react';
import { Client } from '@/lib/types';
import { useClientState } from './use-client-state';
import { useClientCrud } from './operations/client-crud';
import { useClientFilter } from './operations/client-filter';

/**
 * Main hook for client operations, combining state, CRUD, and filtering functionality
 */
export const useClientOperations = () => {
  const { clients, setClients } = useClientState();
  const { initClients, addClient, updateClient, deleteClient } = useClientCrud();
  const { getClientsByCompanyId } = useClientFilter(clients);

  // Initialize clients on component mount
  useEffect(() => {
    initClients();
  }, []);

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientsByCompanyId
  };
};
