
import { useEffect, useState } from 'react';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, AlertTriangle, UserRound, FileText, Paperclip, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';

const Workflow: React.FC = () => {
  const { actions } = useActions();
  const { responsibles } = useCompany();
  const [workflowItems, setWorkflowItems] = useState<Action[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'atrasado' | 'concluido'>('all');
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const { toast } = useToast();

  // Sort actions by date and group by status
  useEffect(() => {
    const sortedActions = [...actions].sort((a, b) => {
      // Sort by status priority: atrasado -> pendente -> concluido
      const statusPriority = {
        atrasado: 0,
        pendente: 1,
        concluido: 2
      };
      
      const statusDiff = statusPriority[a.status as keyof typeof statusPriority] - 
                        statusPriority[b.status as keyof typeof statusPriority];
      
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by date (most recent first for each status)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Apply filter if not 'all'
    const filteredActions = filterStatus === 'all' 
      ? sortedActions 
      : sortedActions.filter(action => action.status === filterStatus);
    
    setWorkflowItems(filteredActions);
  }, [actions, filterStatus]);

  const getResponsibleName = (id: string) => {
    const responsible = responsibles.find(r => r.id === id);
    return responsible ? responsible.name : 'Não atribuído';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'atrasado':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'concluido':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  // Function to determine file type
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

  // Function to check if attachment can be viewed
  const canViewAttachment = (url: string) => {
    const fileType = getAttachmentFileType(url);
    return fileType === 'image' || fileType === 'pdf';
  };

  // Function to handle attachment download
  const handleDownload = (url: string, filename: string = 'arquivo') => {
    try {
      // Create a new anchor element
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename with appropriate extension if not already provided
      const extension = url.split('.').pop()?.toLowerCase();
      const hasExtension = filename.includes('.');
      
      // Add extension if not already in the filename
      if (!hasExtension && extension) {
        filename = `${filename}.${extension}`;
      }
      
      a.download = filename;
      
      // Append to body, click, and remove to trigger download
      document.body.appendChild(a);
      a.click();
      
      // Remove the element after the download starts
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

  // View attachment in a dialog
  const viewAttachment = (url: string) => {
    setViewingAttachment(url);
  };

  const closeAttachmentViewer = () => {
    setViewingAttachment(null);
  };

  const getWorkflowTimeline = () => {
    return workflowItems.map(action => (
      <div key={action.id} className="workflow-item mb-4">
        <div className="flex">
          <div className="workflow-line mr-4 relative flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              action.status === 'concluido' ? 'bg-green-100' : 
              action.status === 'atrasado' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {getStatusIcon(action.status)}
            </div>
            {/* Line connector */}
            <div className="w-0.5 bg-gray-200 flex-grow mt-1"></div>
          </div>
          
          <Card className="flex-grow mb-2">
            <CardHeader className="p-3 pb-0">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{action.subject}</CardTitle>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  action.status === 'concluido' ? 'bg-green-100 text-green-800' : 
                  action.status === 'atrasado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {action.status === 'concluido' ? 'Concluído' : 
                   action.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <div><span className="font-medium">Responsável:</span> {getResponsibleName(action.responsibleId)}</div>
                <div><span className="font-medium">Início:</span> {format(new Date(action.startDate), "dd/MM/yyyy", { locale: ptBR })}</div>
                <div><span className="font-medium">ID:</span> #{action.id.substring(0, 8)}</div>
                <div><span className="font-medium">Término:</span> {format(new Date(action.endDate), "dd/MM/yyyy", { locale: ptBR })}</div>
                {action.createdByName && (
                  <div className="col-span-2 flex items-center mt-1">
                    <UserRound className="h-3 w-3 mr-1" />
                    <span className="font-medium mr-1">Criado por:</span> {action.createdByName}
                  </div>
                )}
              </div>
              
              {action.completedAt && (
                <div className="mt-1 text-xs">
                  <span className="font-medium">Concluído em:</span> {format(new Date(action.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
              
              <div className="mt-2 text-xs">
                <p className="line-clamp-2">{action.description}</p>
              </div>
              
              <div className="mt-2 flex items-center gap-4">
                {action.notes && action.notes.filter(n => !n.isDeleted).length > 0 && (
                  <div className="text-xs flex items-center">
                    <FileText className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="font-medium text-gray-500">{action.notes.filter(n => !n.isDeleted).length} anotações</span>
                  </div>
                )}
                
                {action.attachments && action.attachments.length > 0 && (
                  <div className="text-xs flex items-center">
                    <Paperclip className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="font-medium text-gray-500 mr-2">{action.attachments.length} anexo(s)</span>
                    <div className="flex space-x-1">
                      {action.attachments.slice(0, 1).map((url, idx) => (
                        <div key={idx} className="flex space-x-1">
                          {canViewAttachment(url) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => viewAttachment(url)}
                            >
                              <Eye className="h-3 w-3 text-blue-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleDownload(url, `anexo-${action.id}-${idx+1}`)}
                          >
                            <Download className="h-3 w-3 text-blue-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Workflow de Ações</h2>
      
      <div className="flex mb-6 space-x-2 overflow-x-auto pb-2">
        <Button 
          variant={filterStatus === 'all' ? 'default' : 'outline'} 
          onClick={() => setFilterStatus('all')}
          size="sm"
        >
          Todas
        </Button>
        <Button 
          variant={filterStatus === 'pendente' ? 'default' : 'outline'} 
          onClick={() => setFilterStatus('pendente')}
          size="sm"
          className="text-yellow-500"
        >
          <Clock className="h-4 w-4 mr-1" />
          Pendentes
        </Button>
        <Button 
          variant={filterStatus === 'atrasado' ? 'default' : 'outline'} 
          onClick={() => setFilterStatus('atrasado')}
          size="sm"
          className="text-red-500"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Atrasadas
        </Button>
        <Button 
          variant={filterStatus === 'concluido' ? 'default' : 'outline'} 
          onClick={() => setFilterStatus('concluido')}
          size="sm"
          className="text-green-500"
        >
          <Check className="h-4 w-4 mr-1" />
          Concluídas
        </Button>
      </div>
      
      <div className="workflow-container">
        {workflowItems.length > 0 ? (
          getWorkflowTimeline()
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhuma ação encontrada para o filtro selecionado
          </div>
        )}
      </div>

      {/* Attachment Viewer Dialog */}
      {viewingAttachment && (
        <Dialog open={!!viewingAttachment} onOpenChange={() => setViewingAttachment(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">Visualização do anexo</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDownload(viewingAttachment, 'anexo')}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
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
    </div>
  );
};

export default Workflow;
