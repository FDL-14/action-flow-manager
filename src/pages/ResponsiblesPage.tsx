
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
import { 
  User, 
  Mail, 
  Briefcase, 
  Plus,
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Pencil,
  Trash2,
  Phone
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import { useAuth } from '@/contexts/AuthContext';
import ResponsibleForm from '@/components/ResponsibleForm';
import { Badge } from '@/components/ui/badge';
import { Responsible } from '@/lib/types';
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

const ResponsiblesPage = () => {
  const { company, responsibles, deleteResponsible } = useCompany();
  const { getActionsByResponsible } = useActions();
  const { user, canUserEditResponsibles, canUserDeleteResponsibles, users } = useAuth();
  
  const [showResponsibleForm, setShowResponsibleForm] = useState(false);
  const [selectedResponsible, setSelectedResponsible] = useState<Responsible | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [responsibleToDelete, setResponsibleToDelete] = useState<Responsible | undefined>(undefined);

  // Filter to show only requesters (solicitantes)
  const requesters = responsibles.filter(resp => 
    resp.type === 'requester' || resp.role === 'Solicitante'
  );
  
  // Add system users that aren't already requesters
  const displayRequesters = [...requesters];
  
  // Check if all users are already included
  const requesterUserIds = requesters
    .filter(req => req.userId)
    .map(req => req.userId);
  
  // Add missing users as requesters for display only (not actually adding to the responsibles list)
  users.forEach(user => {
    if (!requesterUserIds.includes(user.id)) {
      displayRequesters.push({
        id: `user-${user.id}`,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        department: user.department || 'Usuários',
        role: 'Usuário do Sistema',
        userId: user.id,
        type: 'requester',
        companyName: company?.name || '',
        companyId: company?.id || '',
        isSystemUser: true // Flag to identify users automatically added for display
      });
    }
  });

  const handleEdit = (responsible: Responsible) => {
    if (!canUserEditResponsibles()) {
      toast.error("Você não tem permissão para editar solicitantes.");
      return;
    }
    
    // Don't allow editing of auto-added users
    if (responsible.isSystemUser) {
      toast.error("Não é possível editar usuários do sistema adicionados automaticamente.");
      return;
    }
    
    setSelectedResponsible(responsible);
    setShowResponsibleForm(true);
  };

  const handleDelete = (responsible: Responsible) => {
    if (!canUserDeleteResponsibles()) {
      toast.error("Você não tem permissão para excluir solicitantes.");
      return;
    }
    
    // Don't allow deleting of auto-added users
    if (responsible.isSystemUser) {
      toast.error("Não é possível excluir usuários do sistema adicionados automaticamente.");
      return;
    }
    
    // Check if responsible has associated actions
    const actions = getActionsByResponsible(responsible.id);
    if (actions.length > 0) {
      toast.error("Não é possível excluir um solicitante que possui ações associadas.");
      return;
    }
    
    setResponsibleToDelete(responsible);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (responsibleToDelete) {
      deleteResponsible(responsibleToDelete.id);
      setShowDeleteDialog(false);
      toast.success("Solicitante excluído com sucesso!");
    }
  };

  const handleAddNew = () => {
    setSelectedResponsible(undefined);
    setShowResponsibleForm(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Solicitantes</h1>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Solicitante
        </Button>
      </div>

      {displayRequesters.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum solicitante cadastrado</CardTitle>
            <CardDescription>
              Clique no botão "Cadastrar Solicitante" para adicionar seu primeiro solicitante.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Solicitantes</CardTitle>
            <CardDescription>
              Gerenciar solicitantes para atribuição de ações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Ações Atribuídas</TableHead>
                  <TableHead className="text-right">Gerenciar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRequesters.map((responsible) => {
                  const responsibleActions = getActionsByResponsible(responsible.id);
                  const completed = responsibleActions.filter(a => a.status === 'concluido').length;
                  const delayed = responsibleActions.filter(a => a.status === 'atrasado').length;
                  const pending = responsibleActions.filter(a => a.status === 'pendente').length;
                  
                  return (
                    <TableRow key={responsible.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {responsible.name}
                          {responsible.userId && (
                            <Badge className="ml-2 bg-blue-500">Usuário</Badge>
                          )}
                          {responsible.isSystemUser && (
                            <Badge className="ml-2 bg-green-500">Auto</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {responsible.email}
                          </div>
                          {responsible.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {responsible.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                          {responsible.department} - {responsible.role}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {completed > 0 && (
                            <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> {completed}
                            </Badge>
                          )}
                          {delayed > 0 && (
                            <Badge className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {delayed}
                            </Badge>
                          )}
                          {pending > 0 && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {pending}
                            </Badge>
                          )}
                          {responsibleActions.length === 0 && (
                            <span className="text-sm text-gray-500">Nenhuma ação</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(responsible)}
                            disabled={!canUserEditResponsibles() || responsible.isSystemUser}
                            title={
                              responsible.isSystemUser
                                ? "Não é possível editar usuários do sistema adicionados automaticamente"
                                : !canUserEditResponsibles() 
                                  ? "Você não tem permissão para editar" 
                                  : "Editar solicitante"
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(responsible)}
                            disabled={!canUserDeleteResponsibles() || responsibleActions.length > 0 || responsible.isSystemUser}
                            title={
                              responsible.isSystemUser
                                ? "Não é possível excluir usuários do sistema adicionados automaticamente"
                                : !canUserDeleteResponsibles() 
                                  ? "Você não tem permissão para excluir" 
                                  : responsibleActions.length > 0 
                                    ? "Não é possível excluir solicitantes com ações atribuídas"
                                    : "Excluir solicitante"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <ResponsibleForm 
        open={showResponsibleForm}
        onOpenChange={setShowResponsibleForm}
        editResponsible={selectedResponsible}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o solicitante "{responsibleToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResponsiblesPage;
