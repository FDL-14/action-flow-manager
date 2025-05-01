
import { Client } from '@/lib/types';
import { toast } from 'sonner';

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
      console.log("Retornando todos os clientes:", clients.length);
      return clients;
    }
    
    console.log("Buscando clientes para a empresa:", companyId);
    console.log("Total de clientes disponíveis:", clients.length);
    
    // Log detailed information about each client for debugging
    clients.forEach(client => {
      console.log(`Cliente ${client.id} - ${client.name}: companyId=${client.companyId}, target=${companyId}, match=${client.companyId === companyId}`);
    });
    
    const filteredClients = clients.filter(client => {
      // Ensure we're comparing the same data types
      const clientCompanyId = client.companyId ? client.companyId.toString() : '';
      const targetCompanyId = companyId ? companyId.toString() : '';
      
      const result = clientCompanyId === targetCompanyId;
      console.log(`Cliente ${client.name} (${client.id}): companyId=${clientCompanyId}, target=${targetCompanyId}, match=${result}`);
      return result;
    });
    
    console.log("Clientes filtrados para a empresa:", filteredClients.length);
    return filteredClients;
  };

  return {
    getClientsByCompanyId
  };
};
