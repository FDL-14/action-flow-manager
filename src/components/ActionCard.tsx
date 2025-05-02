
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
import { MoreVertical, Edit, Trash2, CheckCircle, Clock, StickyNote, Mail, Phone, MessageSquare, User, Calendar, FileText } from "lucide-react";
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
import { ptBR } from 'date-fns/locale';
import { useMessaging } from '@/services/messaging';

interface ActionCardProps {
  action: Action;
  onDelete: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onDelete }) => {
  const { updateAction } = useActions();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { sendActionNotification } = useMessaging();
  const [showNotes, setShowNotes] = useState(false);

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
      
      // Make sure to pass both required arguments: date and locale
      return formatDateToLocalString(dateObj, ptBR);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Erro ao formatar data";
    }
  };

  // Handle notification sending
  const handleSendNotification = async (type: 'email' | 'whatsapp' | 'sms') => {
    if (!action.responsibleId) {
      toast.error("Não foi possível enviar notificação", {
        description: "Esta ação não possui um responsável definido."
      });
      return;
    }
    
    // Create a compliant Responsible object with all required properties
    const responsible = {
      id: action.responsibleId,
      name: action.responsibleName || 'Responsável',
      email: action.responsibleId + '@example.com', // Placeholder - should be replaced with actual email
      department: 'Departamento',
      role: 'Responsável',
      companyId: action.companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Prepare requester if available
    const requester = action.requesterId ? {
      id: action.requesterId,
      name: action.requesterName || 'Solicitante',
      email: action.requesterId + '@example.com', // Placeholder
      department: 'Departamento',
      role: 'Solicitante',
      companyId: action.companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    } : undefined;
    
    const success = await sendActionNotification(
      responsible,
      requester,
      `Ação: ${action.subject}`,
      action.description || 'Sem descrição disponível.',
      type
    );
    
    if (success) {
      toast.success(`Notificação enviada via ${type === 'email' ? 'E-mail' : type === 'whatsapp' ? 'WhatsApp' : 'SMS'}`);
    }
  };
  
  // Get the most recent note if available
  const recentNote = action.notes && action.notes.length > 0 
    ? action.notes.filter(note => !note.isDeleted).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] 
    : null;

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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              <strong>Responsável:</strong> {action.responsibleName || 'Não definido'}
            </p>
            
            {action.requesterId && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                <strong>Solicitante:</strong> {action.requesterName || 'Não definido'}
              </p>
            )}
            
            {action.createdBy && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                <strong>Criado por:</strong> {action.createdByName || action.createdBy}
              </p>
            )}
            
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <strong>Criado em:</strong> {safeFormatDate(action.createdAt)}
            </p>
          </div>
          
          <div className="mt-2">
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
        
        {/* Recent Notes Section */}
        {recentNote && (
          <div className="mt-4 border-t pt-2">
            <p className="text-sm font-medium">Anotação recente:</p>
            <div className="bg-muted/50 p-2 rounded mt-1">
              <p className="text-sm truncate">{recentNote.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {recentNote.createdByName || 'Usuário'} - {safeFormatDate(recentNote.createdAt)}
              </p>
            </div>
            {action.notes && action.notes.filter(n => !n.isDeleted).length > 1 && (
              <p className="text-xs text-muted-foreground text-right mt-1">
                +{action.notes.filter(n => !n.isDeleted).length - 1} anotações
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSendNotification('email')}
            className="flex items-center gap-1"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSendNotification('whatsapp')}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSendNotification('sms')}
            className="flex items-center gap-1"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">SMS</span>
          </Button>
        </div>
        
        <Button variant="ghost" size="sm" onClick={() => {}}>
          <StickyNote className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Anotações</span>
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
