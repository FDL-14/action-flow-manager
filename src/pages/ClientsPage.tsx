
import { useState } from 'react';
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
import { Building2, Mail, Phone, Plus, User } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import ClientForm from '@/components/ClientForm';

const ClientsPage = () => {
  const { company, clients } = useCompany();
  const { getActionsByClient } = useActions();
  const [showClientForm, setShowClientForm] = useState(false);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          {company?.logo && (
            <img 
              src={company.logo} 
              alt={`${company.name} Logo`} 
              className="h-10 mr-3" 
            />
          )}
          <h1 className="text-2xl font-bold">Gerenciamento de Clientes</h1>
        </div>
        <Button onClick={() => setShowClientForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Cliente
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum cliente cadastrado</CardTitle>
            <CardDescription>
              Clique no botão "Cadastrar Cliente" para adicionar seu primeiro cliente.
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
                  <TableHead>Contato</TableHead>
                  <TableHead>Ações Relacionadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const clientActions = getActionsByClient(client.id);
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {client.name}
                        </div>
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
        onOpenChange={setShowClientForm}
      />
    </div>
  );
};

export default ClientsPage;
