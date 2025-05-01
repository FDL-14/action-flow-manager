import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, CheckCircle, Clock, StickyNote } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Action } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useActions } from '@/contexts/ActionContext';
import ActionForm from '@/components/ActionForm';
import DeleteActionDialog from '@/components/DeleteActionDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ActionCardProps {
  action: Action;
  onDelete: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onDelete }) => {
  const { updateAction } = useActions();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStatusChange = async (newStatus: 'complete' | 'delayed' | 'pending') => {
    try {
      const updatedAction = { ...action, status: newStatus };
      await updateAction(updatedAction);
      
      let toastMessage = '';
      switch (newStatus) {
        case 'complete':
          toastMessage = `Ação "${action.title}" marcada como concluída.`;
          break;
        case 'delayed':
          toastMessage = `Ação "${action.title}" marcada como atrasada.`;
          break;
        default:
          toastMessage = `Status da ação "${action.title}" atualizado.`;
          break;
      }
      
      toast.success("Status atualizado", {
        description: toastMessage
      });
    } catch (error) {
      console.error("Erro ao atualizar status da ação:", error);
      toast.error("Erro ao atualizar", {
        description: "Não foi possível atualizar o status desta ação. Tente novamente."
      });
    }
  };

  const formatDate = (date: Date): string => {
    return format(date, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{action.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('complete')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Concluída
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('delayed')}>
                <Clock className="h-4 w-4 mr-2" />
                Marcar como Atrasada
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>{action.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Data Limite:</strong> {formatDate(new Date(action.dueDate))}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Responsável:</strong> {action.assignee}
          </p>
          <div>
            <strong>Status:</strong>
            {action.status === 'pending' && (
              <Badge variant="secondary">Pendente</Badge>
            )}
            {action.status === 'complete' && (
              <Badge variant="success">Concluída</Badge>
            )}
            {action.status === 'delayed' && (
              <Badge variant="destructive">Atrasada</Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button variant="ghost">
          <StickyNote className="h-4 w-4 mr-2" />
          Adicionar Nota
        </Button>
      </CardFooter>

      <ActionForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        action={action}
      />

      {/* Update the DeleteActionDialog to use onDeleted instead of onDelete */}
      <DeleteActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        actionId={action.id}
        actionSubject={action.title}
        onDeleted={onDelete}
      />
    </Card>
  );
};

export default ActionCard;
