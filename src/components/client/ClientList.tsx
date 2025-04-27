
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import { Client } from '@/lib/types';
import { Building2, Mail, Phone, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  getCompanyNameById: (id: string) => string;
  canEditClients: boolean;
  canDeleteClients: boolean;
}

export const ClientList = ({ 
  clients, 
  onEdit, 
  onDelete, 
  getCompanyNameById,
  canEditClients,
  canDeleteClients 
}: ClientListProps) => {
  const { getActionsByClient } = useActions();

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum cliente cadastrado</CardTitle>
          <CardDescription>
            Não há clientes para esta empresa.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
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
            {clients.map((client) => {
              const clientActions = getActionsByClient(client.id);
              const companyName = getCompanyNameById(client.companyId);
              
              return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell>{companyName || 'Empresa não encontrada'}</TableCell>
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
                          onClick={() => onEdit(client)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {canDeleteClients && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(client)}
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
  );
};
