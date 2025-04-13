
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Check, 
  Paperclip, 
  FileText, 
  AlertTriangle, 
  Mail, 
  FileImage,
  Download,
  Edit,
  UserRound
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ActionNotes from './ActionNotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import EditActionForm from './EditActionForm';

interface ActionCardProps {
  action: Action;
}

const ActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const { responsibles, clients } = useCompany();
  const { updateActionStatus, sendActionEmail } = useActions();
  const [showNotes, setShowNotes] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const responsible = responsibles.find(r => r.id === action.responsibleId);
  const client = action.clientId ? clients.find(c => c.id === action.clientId) : null;
  const requester = action.requesterId ? responsibles.find(r => r.id === action.requesterId) : null;
  
  const getStatusColor = () => {
    switch(action.status) {
      case 'concluido':
        return 'border-l-green-500 bg-green-50';
      case 'atrasado':
        return 'border-l-red-500 bg-red-50';
      case 'pendente':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500';
    }
  };

  const getStatusBadge = () => {
    switch(action.status) {
      case 'concluido':
        return <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-500 hover:bg-red-600">Atrasado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Pendente</Badge>;
      default:
        return null;
    }
  };

  const handleMarkComplete = () => {
    setShowNotes(true);
  };

  const handleCompleteAction = () => {
    updateActionStatus(action.id, 'concluido', new Date());
    setShowNotes(false);
    toast({
      title: "Ação concluída",
      description: "A ação foi marcada como concluída com sucesso.",
      variant: "default",
    });
  };

  const handleMarkIncomplete = () => {
    updateActionStatus(action.id, 'pendente');
    toast({
      title: "Ação pendente",
      description: "A ação foi marcada como pendente.",
      variant: "default",
    });
  };

  const handleMarkDelayed = () => {
    updateActionStatus(action.id, 'atrasado');
    toast({
      title: "Ação atrasada",
      description: "A ação foi marcada como atrasada.",
      variant: "destructive",
    });
  };

  const handleSendEmail = async () => {
    await sendActionEmail(action.id);
  };

  const handleEditAction = () => {
    setShowEditForm(true);
  };

  const toggleNotes = () => setShowNotes(!showNotes);
  const closeNotes = () => setShowNotes(false);

  const canManageAction = () => {
    if (!user) return false;
    
    if (user.role === 'master') return true;
    
    if (action.responsibleId === user.id) return true;
    
    const hasViewAllPermission = user.permissions?.some(p => p.viewAllActions);
    
    return hasViewAllPermission || false;
  };

  const canEditAction = () => {
    if (!user) return false;
    
    if (user.role === 'master') return true;
    
    const hasEditPermission = user.permissions?.some(p => p.canEditAction);
    
    return hasEditPermission || false;
  };

  const getLatestAttachment = () => {
    if (!action.attachments || action.attachments.length === 0) return null;
    
    const latestAttachment = action.attachments[action.attachments.length - 1];
    return latestAttachment;
  };

  const isImageAttachment = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png)$/i) !== null;
  };
  
  const handleDownload = (url: string, filename: string = 'arquivo') => {
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      
      // Remover o elemento depois do download iniciar
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
      
      toast({
        title: "Download iniciado",
        description: "O download do arquivo foi iniciado.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const latestAttachment = getLatestAttachment();

  return (
    <Card className={`mb-4 border-l-4 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge()}
              <h3 className="text-lg font-semibold">{action.subject}</h3>
            </div>
            {client && (
              <div className="text-sm text-gray-600 mb-1">
                Cliente: {client.name}
              </div>
            )}
            {responsible && (
              <div className="text-sm text-gray-600 mb-1">
                Responsável: {responsible.name}
              </div>
            )}
            {requester && (
              <div className="text-sm text-gray-600 mb-1">
                Solicitante: {requester.name}
              </div>
            )}
            {action.createdByName && (
              <div className="text-sm text-gray-600 mb-2 flex items-center">
                <UserRound className="h-3 w-3 mr-1" />
                <span>Criado por: {action.createdByName}</span>
              </div>
            )}
            <p className="text-sm text-gray-700 mb-3">{action.description}</p>
            <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Início:</span> {new Date(action.startDate).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Término:</span> {new Date(action.endDate).toLocaleDateString()}
              </div>
              {action.completedAt && (
                <div className="col-span-2 mt-1">
                  <span className="font-medium">Concluído em:</span> {new Date(action.completedAt).toLocaleDateString()} 
                  ({formatDistanceToNow(new Date(action.completedAt), { addSuffix: true, locale: ptBR })})
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendEmail}
              className="hidden sm:flex"
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
            
            {canEditAction() && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEditAction}
                className="hidden sm:flex"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManageAction() && action.status !== 'concluido' && (
                  <DropdownMenuItem onClick={handleMarkComplete}>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Marcar como concluído
                  </DropdownMenuItem>
                )}
                {canManageAction() && action.status === 'concluido' && (
                  <DropdownMenuItem onClick={handleMarkIncomplete}>
                    Marcar como pendente
                  </DropdownMenuItem>
                )}
                {canManageAction() && action.status !== 'atrasado' && (
                  <DropdownMenuItem onClick={handleMarkDelayed}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                    Marcar como atrasado
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={toggleNotes}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver anotações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendEmail} className="sm:hidden">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar email
                </DropdownMenuItem>
                {canEditAction() && (
                  <DropdownMenuItem onClick={handleEditAction} className="sm:hidden">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {(action.attachments && action.attachments.length > 0) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center mb-2 text-sm text-gray-600">
              <Paperclip className="h-4 w-4 mr-1" />
              <span>{action.attachments.length} anexo(s)</span>
            </div>
            
            {latestAttachment && (
              <div className="border rounded-md p-2 flex items-center justify-between">
                <div className="flex items-center">
                  {isImageAttachment(latestAttachment) ? (
                    <div className="flex items-center">
                      <FileImage className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="text-sm mr-2">Imagem anexada</span>
                      <img 
                        src={latestAttachment} 
                        alt="Anexo" 
                        className="h-10 w-10 object-cover rounded" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="text-sm">Documento anexado</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDownload(latestAttachment, `anexo-${action.id}`)}
                >
                  <Download className="h-5 w-5 text-blue-500 hover:text-blue-700" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showNotes && (
        <Dialog open={showNotes} onOpenChange={setShowNotes}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {action.status !== 'concluido' ? 
                  `Anotações - ${action.subject}` : 
                  `Anotações - ${action.subject}`}
              </DialogTitle>
            </DialogHeader>
            <ActionNotes 
              action={action} 
              onClose={closeNotes} 
              onComplete={handleCompleteAction}
            />
          </DialogContent>
        </Dialog>
      )}

      {showEditForm && (
        <EditActionForm 
          open={showEditForm}
          onOpenChange={setShowEditForm}
          action={action}
        />
      )}
    </Card>
  );
};

export default ActionCard;
