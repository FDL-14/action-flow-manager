
import { Client } from '@/lib/types';
import { useClientState } from '../use-client-state';
import { useClientAdd } from './crud/client-add';
import { useClientUpdate } from './crud/client-update';
import { useClientDelete } from './crud/client-delete';
import { useClientInit } from './crud/client-init';

/**
 * Combined hook for client CRUD operations
 */
export const useClientCrud = () => {
  const { clients } = useClientState();
  const { initClients } = useClientInit();
  const { addClient } = useClientAdd();
  const { updateClient } = useClientUpdate();
  const { deleteClient } = useClientDelete();

  return {
    clients,
    initClients,
    addClient,
    updateClient,
    deleteClient
  };
};
