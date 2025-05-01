import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Check, 
  MoreVertical, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  Eye, 
  Mail,
  MessageSquare,
  Phone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import DeleteActionDialog from './DeleteActionDialog';
import EditActionForm from './EditActionForm';
import CompleteActionDialog from './CompleteActionDialog';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Action } from '@/lib/types';
import { useMessaging } from '@/services/messaging';
import { toast } from 'sonner';

interface ActionCardProps {
  action: Action;
  onDelete: () => void;
  onMenuClick: () => void;
  isProcessing: boolean;
  onView: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onDelete,
  onMenuClick,
  isProcessing,
  onView
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const { updateActionStatus } = useActions();
  const { responsibles, clients } = useCompany();
  const { user } = useAuth();
  const { sendActionNotification } = useMessaging();

  const responsible = responsibles.find(r => r.id === action.responsibleId);
  const client = action.clientId ? clients.find(c => c.id === action.clientId) : null;
  const requester = action.requesterId ? responsibles.find(r => r.id === action.requesterId) : null;
  
  const createdAt = new Date(action.createdAt);
  const endDate = new Date(action.endDate);
  const isOverdue = !action.completedAt && endDate < new Date();
  
  // Update action to overdue if needed
  React.useEffect(() => {
    if (isOverdue && action.status === 'pendente') {
      updateActionStatus(action.id, 'atrasado');
    }
  }, [isOverdue, action.status, action.id, updateActionStatus]);

  const handleStatusChange = (status: 'pendente' | 'concluido' | 'atrasado' | 'aguardando_aprovacao') => {
    updateActionStatus(action.id, status);
    
    if (status === 'concluido' && responsible) {
      sendActionNotification(
        responsible,
        requester,
        `Ação "${action.subject}" foi concluída`,
        `A ação "${action.subject}" foi marcada como concluída.\n\nDescrição: ${action.description}\n\nData de término: ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`
      );
    }
  };

  const handleSendNotification = (type: 'email' | 'whatsapp' | 'sms') => {
    if (!responsible) {
      toast.error("Não foi possível enviar notificação", {
        description: "Nenhum responsável encontrado para esta ação."
      });
      return;
    }
    
    sendActionNotification(
      responsible,
      requester,
      `Lembrete: Ação "${action.subject}"`,
      `Esta é uma notificação sobre a ação "${action.subject}" que foi atribuída a você.\n\nDescrição: ${action.description}\n\nData de término: ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`,
      type
    );
  };

  const getStatusBadge = () => {
    switch (action.status) {
      case 'concluido':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <Check className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'atrasado':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Atrasado
          </Badge>
        );
      case 'aguardando_aprovacao':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Aprovação
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };
  
  const getPriorityClass = () => {
    if (isOverdue) return 'border-l-4 border-red-500';
    if (action.status === 'concluido') return 'border-l-4 border-green-500';
    if (action.status === 'aguardando_aprovacao') return 'border-l-4 border-blue-500';
    
    // Check if within 3 days of deadline
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const timeToDeadline = endDate.getTime() - new Date().getTime();
    if (timeToDeadline < threeDaysInMs && timeToDeadline > 0) {
      return 'border-l-4 border-orange-500';
    }
    
    return 'border-l-4 border-gray-300';
  };

  return (
    <>
      <Card className={`mb-4 ${getPriorityClass()} transition-all ${isProcessing ? 'opacity-50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold line-clamp-1">{action.subject}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-1">
                {getStatusBadge()}
                {client && (
                  <Badge variant="outline" className="bg-gray-100">
                    Cliente: {client.name}
                  </Badge>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={onMenuClick}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Visualizar</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => handleSendNotification('email')}>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Enviar por E-mail</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleSendNotification('whatsapp')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Enviar por WhatsApp</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleSendNotification('sms')}>
                  <Phone className="mr-2 h-4 w-4" />
                  <span>Enviar por SMS</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {action.status !== 'concluido' && (
                  <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
                    <Check className="mr-2 h-4 w-4" />
                    <span>Marcar como concluído</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-gray-500 text-sm mb-2 line-clamp-2">
            {action.description || "Sem descrição"}
          </div>
          
          <div className="text-xs text-gray-500 mt-3 space-y-1">
            <div>
              <span className="font-medium">Responsável:</span> {responsible?.name || "Não atribuído"}
            </div>
            {requester && (
              <div>
                <span className="font-medium">Solicitante:</span> {requester.name}
              </div>
            )}
            <div>
              <span className="font-medium">Criado por:</span> {action.createdByName || user?.name || "Sistema"}
            </div>
            <div className="flex flex-wrap gap-x-4">
              <div>
                <span className="font-medium">Criado em:</span> {format(createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
              <div>
                <span className="font-medium">Término:</span> {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
          </div>
          
          {action.notes && action.notes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-semibold mb-2">Anotações recentes:</h4>
              {action.notes
                .filter(note => !note.isDeleted)
                .slice(0, 2)
                .map(note => (
                  <div key={note.id} className="text-xs border-l-2 border-gray-200 pl-2 mb-2">
                    <div className="text-gray-400 mb-1">
                      {format(new Date(note.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                    <p className="line-clamp-1">{note.content}</p>
                  </div>
                ))}
              {action.notes.filter(note => !note.isDeleted).length > 2 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs" 
                  onClick={onView}
                >
                  Ver todas as anotações
                </Button>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="text-xs h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              Detalhes
            </Button>
          </div>
          
          {action.status !== 'concluido' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleteDialog(true)}
              className="text-xs h-8 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-900 text-green-700"
            >
              <Check className="h-3 w-3 mr-1" />
              Concluir
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <DeleteActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        actionId={action.id}
        actionSubject={action.subject}
        onDelete={onDelete}
      />
      
      <EditActionForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        action={action}
      />
      
      <CompleteActionDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        action={action}
        onComplete={() => handleStatusChange('concluido')}
      />
    </>
  );
};

export default ActionCard;
