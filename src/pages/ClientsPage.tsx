
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import ClientForm from '@/components/ClientForm';
import { Client } from '@/lib/types';
import { toast } from 'sonner';
import { ClientList } from '@/components/client/ClientList';
import { ClientFilterCard } from '@/components/client/ClientFilterCard';
import { DeleteClientDialog } from '@/components/client/DeleteClientDialog';

const ClientsPage = () => {
  const { company, clients, deleteClient, companies, getClientsByCompanyId } = useCompany();
  const { user } = useAuth();
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(company?.id);

  const canEditClients = user?.role === 'master' || 
                        user?.permissions?.some(p => p.canEdit || p.canEditClient || p.canCreateClient);
  const canCreateClient = user?.role === 'master' || 
                       user?.permissions?.some(p => p.canCreate || p.canCreateClient);
  const canDeleteClients = user?.role === 'master' || 
                        user?.permissions?.some(p => p.canDelete || p.canDeleteClient);

  useEffect(() => {
    if (company) {
      setSelectedCompanyId(company.id);
    }
  }, [company]);

  // Update client company names when companies change
  useEffect(() => {
    if (companies.length > 0 && clients.length > 0) {
      const updatedClients = clients.map(client => {
        if (client.companyId) {
          const companyName = companies.find(c => c.id === client.companyId)?.name;
          if (companyName && client.companyName !== companyName) {
            return { ...client, companyName };
          }
        }
        return client;
      });
      
      // Check if any client was updated
      const hasChanges = updatedClients.some((client, index) => 
        client.companyName !== clients[index].companyName
      );
      
      // If there were changes, update the context
      if (hasChanges) {
        console.log("Atualizando nomes de empresas para clientes");
        // We can't update the actual context here, but we can update our local state
      }
    }
  }, [companies, clients]);

  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== 'all') {
      try {
        const filtered = getClientsByCompanyId(selectedCompanyId);
        
        // Ensure company names are set
        const enhancedClients = filtered.map(client => {
          if (!client.companyName && client.companyId) {
            const company = companies.find(c => c.id === client.companyId);
            return {
              ...client,
              companyName: company ? company.name : 'Empresa não encontrada'
            };
          }
          return client;
        });
        
        setFilteredClients(enhancedClients);
      } catch (error) {
        console.error("Erro ao filtrar clientes:", error);
        setFilteredClients([]);
        toast.error("Erro ao filtrar clientes");
      }
    } else {
      // Ensure company names are set for all clients
      const enhancedClients = clients.map(client => {
        if (!client.companyName && client.companyId) {
          const company = companies.find(c => c.id === client.companyId);
          return {
            ...client,
            companyName: company ? company.name : 'Empresa não encontrada'
          };
        }
        return client;
      });
      
      setFilteredClients(enhancedClients);
    }
  }, [clients, selectedCompanyId, getClientsByCompanyId, companies]);

  const handleEditClient = (client: Client) => {
    console.log("Editando cliente:", client);
    
    // Ensure the client has the correct company name before editing
    if (client.companyId && !client.companyName) {
      const company = companies.find(c => c.id === client.companyId);
      if (company) {
        client.companyName = company.name;
      }
    }
    
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleCloseForm = () => {
    setShowClientForm(false);
    setEditingClient(undefined);
  };

  const handleAddClient = () => {
    if (canCreateClient) {
      setEditingClient(undefined);
      setShowClientForm(true);
    } else {
      toast.error("Permissão negada", {
        description: "Você não tem permissão para adicionar clientes."
      });
    }
  };

  const handleDeleteClient = (client: Client) => {
    if (canDeleteClients) {
      setClientToDelete(client);
    } else {
      toast.error("Permissão negada", {
        description: "Você não tem permissão para excluir clientes."
      });
    }
  };

  const confirmDeleteClient = async () => {
    if (clientToDelete) {
      try {
        await deleteClient(clientToDelete.id);
        setClientToDelete(null);
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        toast.error("Erro ao excluir cliente", {
          description: "Não foi possível excluir o cliente. Por favor, tente novamente."
        });
      }
    }
  };

  const getCompanyNameById = (companyId: string): string => {
    if (!companyId) return 'Empresa não associada';
    
    const foundCompany = companies.find(c => c.id === companyId);
    
    if (foundCompany) {
      return foundCompany.name;
    } else {
      return 'Empresa não encontrada';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Clientes</h1>
        {canCreateClient && (
          <Button onClick={handleAddClient}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Cliente
          </Button>
        )}
      </div>

      <div className="mb-6">
        <ClientFilterCard
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onCompanySelect={setSelectedCompanyId}
        />
      </div>

      <ClientList
        clients={filteredClients}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        getCompanyNameById={getCompanyNameById}
        canEditClients={canEditClients}
        canDeleteClients={canDeleteClients}
      />

      <ClientForm 
        open={showClientForm}
        onOpenChange={handleCloseForm}
        editClient={editingClient}
        isNewClient={!editingClient}
      />

      <DeleteClientDialog
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={confirmDeleteClient}
        client={clientToDelete || undefined}
      />
    </div>
  );
};

export default ClientsPage;
