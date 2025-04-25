
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Building2, Mail, Phone, Plus, Edit, Trash } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import { useAuth } from '@/contexts/AuthContext';
import ClientForm from '@/components/ClientForm';
import { Client } from '@/lib/types';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const ClientsPage = () => {
  const { company, clients, deleteClient, companies, getClientsByCompanyId } = useCompany();
  const { getActionsByClient } = useActions();
  const { user } = useAuth();
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(company?.id);

  const canEditClients = user?.role === 'master' || user?.permissions?.some(p => p.canEdit || p.canEditClient);
  const canDeleteClients = user?.role === 'master' || user?.permissions?.some(p => p.canDelete || p.canDeleteClient);

  // Set initial company filter when company changes
  useEffect(() => {
    console.log("ClientsPage - company changed:", company?.id);
    if (company) {
      setSelectedCompanyId(company.id);
    }
  }, [company]);

  // Filter clients when selection or client list changes
  useEffect(() => {
    console.log("Filtrando clientes com selectedCompanyId:", selectedCompanyId);
    console.log("Total de clientes disponíveis:", clients.length);
    
    if (selectedCompanyId && selectedCompanyId !== 'all') {
      try {
        const filtered = clients.filter(client => client.companyId === selectedCompanyId);
        console.log("Clientes filtrados:", filtered);
        setFilteredClients(filtered);
      } catch (error) {
        console.error("Erro ao filtrar clientes:", error);
        setFilteredClients([]);
        toast.error("Erro ao filtrar clientes");
      }
    } else {
      setFilteredClients(clients);
    }
  }, [clients, selectedCompanyId]);

  const handleEditClient = (client: Client) => {
    console.log("Editando cliente:", client);
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleCloseForm = () => {
    setShowClientForm(false);
    setEditingClient(undefined);
  };

  const handleDeleteClient = (id: string) => {
    if (canDeleteClients) {
      setClientToDelete(id);
    } else {
      toast.error("Permissão negada", {
        description: "Você não tem permissão para excluir clientes."
      });
    }
  };

  const confirmDeleteClient = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };

  const handleAddClient = () => {
    if (canEditClients) {
      setEditingClient(undefined);
      setShowClientForm(true);
    } else {
      toast.error("Permissão negada", {
        description: "Você não tem permissão para adicionar clientes."
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Clientes</h1>
        {canEditClients && (
          <Button onClick={handleAddClient}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Cliente
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <h3 className="text-lg font-medium">Filtrar por empresa</h3>
              <p className="text-sm text-gray-500">Selecione uma empresa para ver seus clientes</p>
            </div>
            <Select 
              value={selectedCompanyId} 
              onValueChange={(value) => setSelectedCompanyId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
                {companies.length === 0 && (
                  <SelectItem value="no_companies" disabled>Nenhuma empresa disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum cliente cadastrado</CardTitle>
            <CardDescription>
              {selectedCompanyId && selectedCompanyId !== 'all' ? 
                "Não há clientes para esta empresa." : 
                "Clique no botão \"Cadastrar Cliente\" para adicionar seu primeiro cliente."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Gerenciar clientes para associação com ações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Ações Relacionadas</TableHead>
                  <TableHead className="text-right">Gerenciar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const clientActions = getActionsByClient(client.id);
                  const clientCompany = companies.find(c => c.id === client.companyId);
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {clientCompany?.name || (
                          <span className="text-yellow-600">Empresa não encontrada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-2 text-gray-400" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-2 text-gray-400" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-sm">{clientActions.length} ações</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {canEditClients && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClient(client)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          {canDeleteClients && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ClientForm 
        open={showClientForm}
        onOpenChange={handleCloseForm}
        editClient={editingClient}
      />

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e todas as ações associadas podem ser afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteClient}
              className="bg-red-500 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsPage;
