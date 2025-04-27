
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActions } from '@/contexts/ActionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, UserRound, Building2, Calendar, Check, Clock, 
  AlertTriangle, Edit, Trash, FileText, Eye, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { calculateDaysRemaining } from '@/lib/date-utils';
import DeleteActionDialog from './DeleteActionDialog';
import EditActionForm from './EditActionForm';
import ActionNotes from './ActionNotes';
import CompleteActionDialog from './CompleteActionDialog';
import { toast } from 'sonner';

interface ActionCardProps {
  action: any;
  onDelete: () => void;
  onMenuClick?: () => void;
  isProcessing?: boolean;
  onView?: () => void;
}

const ActionCard = ({
  action,
  onDelete,
  onMenuClick,
  isProcessing = false,
  onView
}: ActionCardProps) => {
  const { responsibles, clients, companies } = useCompany();
  const { user } = useAuth();
  const { updateActionStatus, updateAction } = useActions();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  
  const daysRemaining = calculateDaysRemaining(action.endDate);
  const isOverdue = action.status === 'atrasado';
  const isCompleted = action.status === 'concluido';
  const isAwaitingApproval = action.status === 'aguardando_aprovacao';

  // Get responsible name
  const responsible = responsibles.find(r => r.id === action.responsibleId);
  const responsibleName = responsible ? responsible.name : 'Não atribuído';
  
  // Get client name if available
  const client = action.clientId ? clients.find(c => c.id === action.clientId) : null;
  const clientName = client ? client.name : 'Não especificado';
  
  // Get company name
  const company = companies.find(c => c.id === action.companyId);
  const companyName = company ? company.name : 'Não especificada';
  
  // Check if current user is the requester
  const isRequester = action.requesterId && user && (
    action.requesterId === user.id || 
    (user.requesterIds && user.requesterIds.includes(action.requesterId))
  );
  
  // Permission checks
  const canDelete = user?.permissions?.some(p => p.canDelete) || user?.role === 'master';
  const canEdit = user?.permissions?.some(p => p.canEdit) || user?.role === 'master';
  const canAddNotes = user?.permissions?.some(p => p.canAddNotes) || user?.role === 'master';
  const canMarkComplete = user?.permissions?.some(p => p.canMarkComplete) || user?.role === 'master';
  
  const handleMarkComplete = async () => {
    if (!canMarkComplete) return;
    
    // Check if there are notes already, if not, open notes dialog
    if (!action.notes || action.notes.filter(n => !n.isDeleted).length === 0) {
      setShowNotes(true);
      return;
    }
    
    // Show completion dialog with justification requirement
    setShowCompleteDialog(true);
  };
  
  const handleMarkDelayed = async () => {
    try {
      await updateActionStatus(action.id, 'atrasado');
    } catch (error) {
      console.error('Erro ao marcar ação como atrasada:', error);
    }
  };
  
  const handleApprove = async () => {
    if (!isRequester && user?.role !== 'master') {
      toast.error("Permissão negada", {
        description: "Apenas o solicitante pode aprovar esta ação."
      });
      return;
    }
    
    try {
      await updateAction(action.id, {
        status: 'concluido',
        approved: true,
        approvedAt: new Date(),
        approvedBy: user?.id,
        completedAt: new Date()
      });
      
      toast.success("Ação aprovada", {
        description: "A ação foi marcada como concluída com sucesso."
      });
    } catch (error) {
      console.error('Erro ao aprovar ação:', error);
      toast.error("Erro ao aprovar", {
        description: "Não foi possível aprovar esta ação. Tente novamente."
      });
    }
  };
  
  const handleReject = async () => {
    if (!isRequester && user?.role !== 'master') {
      toast.error("Permissão negada", {
        description: "Apenas o solicitante pode rejeitar esta ação."
      });
      return;
    }
    
    try {
      await updateAction(action.id, {
        status: 'pendente',
        approved: false,
      });
      
      toast.info("Ação rejeitada", {
        description: "A ação foi rejeitada e voltou para status pendente."
      });
    } catch (error) {
      console.error('Erro ao rejeitar ação:', error);
      toast.error("Erro ao rejeitar", {
        description: "Não foi possível rejeitar esta ação. Tente novamente."
      });
    }
  };

  const getStatusBadge = () => {
    switch (action.status) {
      case 'pendente':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
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
            <ThumbsUp className="h-3 w-3 mr-1" />
            Aguardando aprovação
          </Badge>
        );
      default:
        return <Badge variant="outline">{action.status}</Badge>;
    }
  };

  return (
    <>
      <Card className={`overflow-hidden transition-all ${isProcessing ? 'shadow-md' : 'shadow-sm'}`}>
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold line-clamp-1">{action.subject}</h3>
                <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                  {getStatusBadge()}
                  {!isCompleted && !isAwaitingApproval && daysRemaining !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isOverdue 
                        ? 'bg-red-100 text-red-800' 
                        : daysRemaining <= 1 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isOverdue 
                        ? 'Vencido' 
                        : daysRemaining === 0 
                          ? 'Vence hoje' 
                          : daysRemaining === 1 
                            ? 'Vence amanhã' 
                            : `${daysRemaining} dias restantes`
                      }
                    </span>
                  )}
                  
                  {isAwaitingApproval && isRequester && (
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 text-xs bg-green-100 text-green-700 hover:bg-green-200 border-green-300"
                        onClick={handleApprove}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Aprovar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 text-xs bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
                        onClick={handleReject}
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={onMenuClick}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onView && (
                    <DropdownMenuItem onClick={onView} className="gap-2">
                      <Eye className="h-4 w-4" />
                      <span>Visualizar</span>
                    </DropdownMenuItem>
                  )}
                  
                  {canAddNotes && (
                    <DropdownMenuItem onClick={() => setShowNotes(true)} className="gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Anotações</span>
                    </DropdownMenuItem>
                  )}
                  
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setShowEditForm(true)} className="gap-2">
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                  )}
                  
                  {canDelete && (
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 gap-2">
                      <Trash className="h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  )}
                  
                  {!isCompleted && !isAwaitingApproval && canMarkComplete && (
                    <DropdownMenuItem onClick={handleMarkComplete} className="text-green-600 gap-2">
                      <Check className="h-4 w-4" />
                      <span>Marcar como concluído</span>
                    </DropdownMenuItem>
                  )}
                  
                  {!isOverdue && !isCompleted && !isAwaitingApproval && (
                    <DropdownMenuItem onClick={handleMarkDelayed} className="text-amber-600 gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Marcar como atrasado</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="mt-3">
              <p className="text-sm text-gray-600 line-clamp-2">{action.description}</p>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              <div className="flex items-center text-xs text-gray-500">
                <UserRound className="h-3 w-3 mr-1 text-gray-400" />
                {responsibleName}
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <Building2 className="h-3 w-3 mr-1 text-gray-400" />
                {clientName} / {companyName}
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                {format(new Date(action.startDate), "dd/MM/yyyy", { locale: ptBR })} -
                {format(new Date(action.endDate), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              
              {action.notes && action.notes.filter(n => !n.isDeleted).length > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  <FileText className="h-3 w-3 mr-1" />
                  {action.notes.filter(n => !n.isDeleted).length} anotações
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteActionDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        actionId={action.id}
        actionSubject={action.subject}
        onDeleted={onDelete}
      />
      
      {showEditForm && (
        <EditActionForm
          open={showEditForm}
          onOpenChange={setShowEditForm}
          action={action}
        />
      )}
      
      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Anotações da Ação</DialogTitle>
          </DialogHeader>
          <ActionNotes 
            action={action} 
            onClose={() => setShowNotes(false)}
          />
        </DialogContent>
      </Dialog>
      
      <CompleteActionDialog
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        action={action}
        onComplete={onDelete} // Refresh the UI
      />
    </>
  );
};

export default ActionCard;
