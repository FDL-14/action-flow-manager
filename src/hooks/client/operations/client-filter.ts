
import { Client } from '@/lib/types';

/**
 * Hook for client filtering operations
 */
export const useClientFilter = (clients: Client[]) => {
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
      console.log(`Cliente ${client.name}: companyId=${client.companyId}, target=${companyId}, match=${result}, companyName=${client.companyName || 'não definido'}`);
      return result;
    });
    
    console.log("Clientes filtrados para a empresa:", filteredClients);
    return filteredClients;
  };

  return {
    getClientsByCompanyId
  };
};
