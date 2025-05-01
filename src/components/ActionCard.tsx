
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
import { useActions } from '@/contexts/ActionContext';
import ActionForm from '@/components/ActionForm';
import DeleteActionDialog from '@/components/DeleteActionDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDateToLocalString, isValidDate } from '@/lib/date-utils';

interface ActionCardProps {
  action: Action;
  onDelete: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onDelete }) => {
  const { updateAction } = useActions();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStatusChange = async (newStatus: 'pendente' | 'concluido' | 'atrasado' | 'aguardando_aprovacao') => {
    try {
      const updatedAction = { ...action, status: newStatus };
      await updateAction(updatedAction);
      
      let toastMessage = '';
      switch (newStatus) {
        case 'concluido':
          toastMessage = `Ação "${action.subject}" marcada como concluída.`;
          break;
        case 'atrasado':
          toastMessage = `Ação "${action.subject}" marcada como atrasada.`;
          break;
        default:
          toastMessage = `Status da ação "${action.subject}" atualizado.`;
          break;
      }
      
      toast(toastMessage, {
        description: "Status atualizado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao atualizar status da ação:", error);
      toast("Erro ao atualizar", {
        description: "Não foi possível atualizar o status desta ação. Tente novamente."
      });
    }
  };

  // Safely format the date, handling both string and Date objects
  const safeFormatDate = (date: Date | string | undefined): string => {
    if (!date) return "Data não definida";
    
    try {
      // Convert to Date object if it's a string
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if the date is valid
      if (!isValidDate(dateObj)) {
        console.warn("Invalid date value:", date);
        return "Data inválida";
      }
      
      // Now we only pass the date since we updated the function signature
      return formatDateToLocalString(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Erro ao formatar data";
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{action.subject}</CardTitle>
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
              <DropdownMenuItem onClick={() => handleStatusChange('concluido')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Concluída
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('atrasado')}>
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
            <strong>Data Limite:</strong> {safeFormatDate(action.endDate)}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Responsável:</strong> {action.responsibleName || 'Não definido'}
          </p>
          <div>
            <strong>Status:</strong>{' '}
            {action.status === 'pendente' && (
              <Badge variant="secondary">Pendente</Badge>
            )}
            {action.status === 'concluido' && (
              <Badge variant="default" className="bg-green-500">Concluída</Badge>
            )}
            {action.status === 'atrasado' && (
              <Badge variant="destructive">Atrasada</Badge>
            )}
            {action.status === 'aguardando_aprovacao' && (
              <Badge variant="outline" className="border-amber-500 text-amber-500">Aguardando Aprovação</Badge>
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
      />

      <DeleteActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        actionId={action.id}
        actionSubject={action.subject}
        onDeleted={onDelete}
      />
    </Card>
  );
};

export default ActionCard;
