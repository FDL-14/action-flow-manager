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
  Image,
  Download,
  Edit,
  UserRound,
  Eye,
  Trash2,
  File,
  Table, 
  FileType,
  X,
  Phone,
  MessageSquare,
  MessageCircle,
  Share
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
  onDelete?: () => void;
  onMenuClick?: () => void;
  isProcessing?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onDelete, onMenuClick, isProcessing = false }) => {
  const { responsibles, clients } = useCompany();
  const { updateActionStatus, sendActionEmail, deleteAction } = useActions();
  const [showNotes, setShowNotes] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [showNotificationOptions, setShowNotificationOptions] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
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

  const handleSendAllNotifications = async () => {
    await sendActionEmail(action.id);
    setShowNotificationOptions(false);
  };

  const handleEditAction = () => {
    setShowEditForm(true);
  };

  const handleDeleteAction = () => {
    if (window.confirm(`Tem certeza que deseja excluir a ação "${action.subject}"? Esta operação não pode ser desfeita.`)) {
      try {
        deleteAction(action.id);
        if (onDelete) onDelete();
        toast({
          title: "Ação excluída",
          description: "A ação foi excluída com sucesso.",
          variant: "default",
        });
      } catch (error) {
        console.error("Erro ao excluir ação:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a ação. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleNotes = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowNotes(!showNotes);
  };
  
  const closeNotes = () => setShowNotes(false);
  
  const toggleAttachments = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAttachments(!showAttachments);
  };

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

  const canDeleteAction = () => {
    return user?.role === 'master';
  };

  const getAttachmentFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return 'excel';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return 'word';
    } else {
      return 'other';
    }
  };

  const getAttachmentIcon = (url: string) => {
    const fileType = getAttachmentFileType(url);
    
    switch (fileType) {
      case 'image':
        return <Image className="h-6 w-6 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'excel':
        return <Table className="h-6 w-6 text-green-500" />;
      case 'word':
        return <FileText className="h-6 w-6 text-blue-700" />;
      default:
        return <FileType className="h-6 w-6 text-gray-500" />;
    }
  };

  const viewAttachment = (url: string) => {
    setViewingAttachment(url);
  };

  const closeAttachmentViewer = () => {
    setViewingAttachment(null);
  };

  const canViewAttachment = (url: string) => {
    const fileType = getAttachmentFileType(url);
    return fileType === 'image' || fileType === 'pdf';
  };
  
  const handleDownload = (url: string, filename: string = 'arquivo') => {
    try {
      // Usar fetch para tratar como blob
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          // Criar URL do objeto blob
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Criar elemento âncora temporário para o download
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          
          // Adicionar a extensão do arquivo se não existir no nome
          const extension = url.split('.').pop()?.toLowerCase();
          const hasExtension = filename.includes('.');
          
          if (!hasExtension && extension) {
            filename = `${filename}.${extension}`;
          }
          
          a.download = filename;
          
          // Adicionar ao DOM, clicar e remover
          document.body.appendChild(a);
          a.click();
          
          // Pequeno timeout para garantir que o download inicie antes de remover
          setTimeout(() => {
            document.body.removeChild(a);
            // Liberar objeto URL
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
          
          toast({
            title: "Download iniciado",
            description: "O download do arquivo foi iniciado.",
            variant: "default",
          });
        })
        .catch(error => {
          console.error("Erro ao fazer download:", error);
          toast({
            title: "Erro no download",
            description: "Não foi possível baixar o arquivo. Tente novamente.",
            variant: "destructive",
          });
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

  const getLatestAttachment = () => {
    if (!action.attachments || action.attachments.length === 0) return null;
    
    const latestAttachment = action.attachments[action.attachments.length - 1];
    return latestAttachment;
  };

  const latestAttachment = getLatestAttachment();

  const handleActionComplete = async () => {
    try {
      setIsUpdating(true);
      console.log('Marcando ação como concluída:', action.id);
      await updateActionStatus(action.id, 'concluido', new Date());
      setShowNotesDialog(false);
      toast.success('Ação marcada como concluída');
    } catch (error) {
      console.error('Erro ao marcar ação como concluída:', error);
      toast.error('Erro ao atualizar status da ação');
    } finally {
      setIsUpdating(false);
    }
  };

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
              onClick={() => setShowNotificationOptions(true)}
              className="hidden sm:flex"
              type="button"
            >
              <Share className="h-4 w-4 mr-1" />
              Notificar
            </Button>
            
            {canEditAction() && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEditAction}
                className="hidden sm:flex"
                type="button"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            
            {canDeleteAction() && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteAction}
                className="hidden sm:flex text-red-600 hover:text-red-800"
                type="button"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isProcessing} type="button" onClick={onMenuClick}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManageAction() && action.status !== 'concluido' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    handleMarkComplete();
                  }}>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Marcar como concluído
                  </DropdownMenuItem>
                )}
                {canManageAction() && action.status === 'concluido' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    handleMarkIncomplete();
                  }}>
                    Marcar como pendente
                  </DropdownMenuItem>
                )}
                {canManageAction() && action.status !== 'atrasado' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    handleMarkDelayed();
                  }}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                    Marcar como atrasado
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={toggleNotes}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver anotações
                </DropdownMenuItem>
                {action.attachments && action.attachments.length > 0 && (
                  <DropdownMenuItem onClick={toggleAttachments}>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Ver anexos
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  setShowNotificationOptions(true);
                }} className="sm:hidden">
                  <Share className="mr-2 h-4 w-4" />
                  Notificar responsáveis
                </DropdownMenuItem>
                {canEditAction() && (
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    handleEditAction();
                  }} className="sm:hidden">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {canDeleteAction() && (
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    handleDeleteAction();
                  }} className="sm:hidden text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir ação
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {(action.attachments && action.attachments.length > 0) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm text-gray-600">
                <Paperclip className="h-4 w-4 mr-1" />
                <span>{action.attachments.length} anexo(s)</span>
              </div>
              {action.attachments.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleAttachments}
                  className="text-xs"
                >
                  Ver todos
                </Button>
              )}
            </div>
            
            {latestAttachment && (
              <div className="border rounded-md p-2 flex items-center justify-between">
                <div className="flex items-center">
                  {getAttachmentFileType(latestAttachment) === 'image' ? (
                    <div className="flex items-center">
                      <Image className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="text-sm mr-2">Imagem anexada</span>
                      <img 
                        src={latestAttachment} 
                        alt="Anexo" 
                        className="h-10 w-10 object-cover rounded cursor-pointer" 
                        onClick={() => viewAttachment(latestAttachment)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {getAttachmentIcon(latestAttachment)}
                      <span className="text-sm ml-2">Documento anexado</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {canViewAttachment(latestAttachment) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => viewAttachment(latestAttachment)}
                    >
                      <Eye className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDownload(latestAttachment, `anexo-${action.id}`)}
                  >
                    <Download className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                  </Button>
                </div>
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

      {showAttachments && (
        <Dialog open={showAttachments} onOpenChange={setShowAttachments}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Anexos - {action.subject}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
              {action.attachments?.map((url, index) => (
                <div key={index} className="border rounded-md p-3 flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Anexo {index + 1}</span>
                  </div>
                  
                  {getAttachmentFileType(url) === 'image' ? (
                    <img 
                      src={url} 
                      alt={`Anexo ${index + 1}`} 
                      className="h-24 object-contain mb-1 cursor-pointer"
                      onClick={() => viewAttachment(url)}
                    />
                  ) : (
                    <div className="h-24 flex items-center justify-center">
                      {getAttachmentIcon(url)}
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-2">
                    {canViewAttachment(url) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewAttachment(url)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(url, `anexo-${index+1}`)}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {viewingAttachment && (
        <Dialog open={!!viewingAttachment} onOpenChange={() => setViewingAttachment(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={closeAttachmentViewer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {getAttachmentFileType(viewingAttachment) === 'image' ? (
              <img 
                src={viewingAttachment} 
                alt="Visualização do anexo" 
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                onError={(e) => {
                  console.error("Erro ao carregar imagem:", e);
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                  target.onerror = null; // Prevent infinite error loop
                }}
              />
            ) : getAttachmentFileType(viewingAttachment) === 'pdf' ? (
              <iframe 
                src={viewingAttachment} 
                width="100%" 
                height="500px" 
                title="Visualização de PDF"
                className="border-0"
              />
            ) : (
              <div className="text-center py-10">
                <FileText className="h-20 w-20 mx-auto text-gray-400 mb-4" />
                <p>Este tipo de arquivo não pode ser visualizado diretamente.</p>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownload(viewingAttachment)} 
                  className="mt-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivo
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showNotificationOptions} onOpenChange={setShowNotificationOptions}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enviar Notificações</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  handleSendAllNotifications();
                }} 
                className="w-full"
                type="button"
              >
                <Share className="mr-2 h-4 w-4" />
                Enviar Todas as Notificações
              </Button>
              
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSendEmail();
                  setShowNotificationOptions(false);
                }} 
                className="w-full"
                type="button"
              >
                <Mail className="mr-2 h-4 w-4" />
                Enviar apenas Email
              </Button>
              
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  sendActionEmail(action.id, 'sms');
                  setShowNotificationOptions(false);
                }} 
                className="w-full"
                type="button"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar apenas SMS
              </Button>
              
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  sendActionEmail(action.id, 'whatsapp');
                  setShowNotificationOptions(false);
                }} 
                className="w-full"
                type="button"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar apenas WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showNotesDialog && (
        <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Anotações - {action.subject}</DialogTitle>
            </DialogHeader>
            <ActionNotes 
              action={action} 
              onClose={() => setShowNotesDialog(false)}
              onComplete={handleActionComplete}
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default ActionCard;
