
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import ClientForm from '@/components/ClientForm';
import { Client } from '@/lib/types';
import { toast } from 'sonner';
import { ClientList } from '@/components/client/ClientList';
import { ClientFilterCard } from '@/components/client/ClientFilterCard';
import { DeleteClientDialog } from '@/components/client/DeleteClientDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ClientsPage = () => {
  const { company, clients, deleteClient, companies, getClientsByCompanyId } = useCompany();
  const { user } = useAuth();
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const canEditClients = user?.role === 'master' || 
                        user?.permissions?.some(p => p.canEdit || p.canEditClient || p.canCreateClient);
  const canCreateClient = user?.role === 'master' || 
                       user?.permissions?.some(p => p.canCreate || p.canCreateClient);
  const canDeleteClients = user?.role === 'master' || 
                        user?.permissions?.some(p => p.canDelete || p.canDeleteClient);

  // Set company filter to match current company if it exists
  useEffect(() => {
    if (company && company.id) {
      console.log("Setting company filter to current company:", company.id, company.name);
      setSelectedCompanyId(company.id);
    } else {
      console.log("No current company, showing all clients");
      setSelectedCompanyId('all');
    }
  }, [company]);

  // Update client company names when companies change
  useEffect(() => {
    setLoading(true);
    try {
      if (companies.length > 0 && clients.length > 0) {
        console.log("Atualizando informações de empresas para clientes");
        console.log(`Total de empresas: ${companies.length}, Total de clientes: ${clients.length}`);
        
        const updatedClients = clients.map(client => {
          if (client.companyId) {
            const company = companies.find(c => c.id === client.companyId);
            if (company && (!client.companyName || client.companyName !== company.name)) {
              console.log(`Atualizando ${client.name}: empresa ${client.companyName || 'N/A'} -> ${company.name}`);
              return { ...client, companyName: company.name };
            }
          }
          return client;
        });
        
        // Check if any client was updated
        const hasChanges = updatedClients.some((client, index) => 
          client.companyName !== clients[index].companyName
        );
        
        // If there were changes, update our local state
        if (hasChanges) {
          console.log("Atualizando nomes de empresas para clientes");
          const filtered = selectedCompanyId === 'all' 
            ? updatedClients 
            : updatedClients.filter(c => c.companyId === selectedCompanyId);
          
          console.log(`Clientes filtrados: ${filtered.length}`);
          setFilteredClients(filtered);
        } else {
          // Apply filtering without updates
          applyFiltering(clients, selectedCompanyId);
        }
      } else {
        // No clients or companies, empty list
        setFilteredClients([]);
      }
    } catch (error) {
      console.error("Erro ao processar clientes:", error);
    } finally {
      setLoading(false);
    }
  }, [companies, clients]);

  // Helper function to apply filtering
  const applyFiltering = (clientList: Client[], companyId: string) => {
    try {
      if (companyId === 'all') {
        console.log("Mostrando todos os clientes");
        
        // Ensure all clients have company names
        const allClients = clientList.map(client => {
          if (!client.companyName && client.companyId) {
            const company = companies.find(c => c.id === client.companyId);
            if (company) {
              console.log(`Definindo nome da empresa para ${client.name}: ${company.name}`);
              return { ...client, companyName: company.name };
            }
          }
          return client;
        });
        
        setFilteredClients(allClients);
      } else {
        console.log(`Filtrando clientes para empresa ${companyId}`);
        
        // Apply filter and ensure company names
        const filtered = clientList.filter(c => c.companyId === companyId).map(client => {
          if (!client.companyName) {
            const company = companies.find(c => c.id === client.companyId);
            if (company) {
              return { ...client, companyName: company.name };
            }
          }
          return client;
        });
        
        console.log(`${filtered.length} clientes encontrados para a empresa selecionada`);
        setFilteredClients(filtered);
      }
    } catch (error) {
      console.error("Erro ao filtrar clientes:", error);
      setFilteredClients([]);
    }
  };

  // Filter clients when selectedCompanyId changes
  useEffect(() => {
    console.log("Filtrando clientes por empresa:", selectedCompanyId);
    console.log("Total de clientes disponíveis:", clients.length);
    
    setLoading(true);
    try {
      applyFiltering(clients, selectedCompanyId);
    } catch (error) {
      console.error("Erro ao filtrar clientes:", error);
      toast.error("Erro ao filtrar clientes");
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

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
    if (companies.length === 0) {
      toast.error("Não é possível criar cliente", {
        description: "É necessário cadastrar pelo menos uma empresa primeiro."
      });
      return;
    }
    
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
        toast.success("Cliente excluído", {
          description: `O cliente ${clientToDelete.name} foi excluído com sucesso.`
        });
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

      {companies.length === 0 && (
        <Alert className="mb-6" variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não há empresas cadastradas. Cadastre pelo menos uma empresa para poder adicionar clientes.
          </AlertDescription>
        </Alert>
      )}

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
        loading={loading}
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
