
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, User } from 'lucide-react';
import { Responsible } from '@/lib/types';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ResponsibleListProps {
  responsibles: Responsible[];
  onEdit: (responsible: Responsible) => void;
}

const ResponsibleList = ({ responsibles, onEdit }: ResponsibleListProps) => {
  const { deleteResponsible } = useCompany();

  const handleDelete = async (id: string) => {
    try {
      await deleteResponsible(id);
      toast.success('Responsável/Solicitante excluído com sucesso');
    } catch (error) {
      console.error('Error deleting responsible:', error);
      toast.error('Erro ao excluir responsável/solicitante');
    }
  };

  const getTypeLabel = (responsible: Responsible) => {
    if (responsible.type === 'requester') return 'Solicitante';
    if (responsible.type === 'responsible') return 'Responsável';
    return responsible.role || 'Responsável/Solicitante';
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Usuário do Sistema</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responsibles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                Nenhum responsável/solicitante encontrado.
              </TableCell>
            </TableRow>
          ) : (
            responsibles.map((responsible) => (
              <TableRow key={responsible.id}>
                <TableCell className="font-medium">{responsible.name}</TableCell>
                <TableCell>{responsible.email}</TableCell>
                <TableCell>{responsible.phone || '-'}</TableCell>
                <TableCell>{responsible.department || '-'}</TableCell>
                <TableCell>{responsible.role || '-'}</TableCell>
                <TableCell>{getTypeLabel(responsible)}</TableCell>
                <TableCell>
                  {responsible.isSystemUser || responsible.userId ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Sim
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Não
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(responsible)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(responsible.id)}
                      className="text-destructive hover:text-destructive/90"
                      disabled={!!responsible.isSystemUser}
                      title={responsible.isSystemUser ? "Não é possível excluir um usuário do sistema" : "Excluir"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResponsibleList;
