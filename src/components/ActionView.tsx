
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, AlertTriangle, Download, Eye, FileText, Paperclip, Mail, MessageSquare, Phone, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Action } from '@/lib/types';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActions } from '@/contexts/ActionContext';
import { Badge } from './ui/badge';
import { useMessaging } from '@/services/messaging';
import { toast } from 'sonner';

interface ActionViewProps {
  action: Action;
  onClose: () => void;
  open: boolean;
}

const ActionView: React.FC<ActionViewProps> = ({ action, onClose, open }) => {
  const { responsibles, clients, companies } = useCompany();
  const { user } = useAuth();
  const { getAttachmentUrl } = useActions();
  const { sendActionNotification } = useMessaging();
  const [attachmentUrls, setAttachmentUrls] = useState<{ path: string; url: string }[]>([]);

  // Find the responsible and requester
  const responsible = responsibles.find(r => r.id === action.responsibleId);
  const requester = action.requesterId ? responsibles.find(r => r.id === action.requesterId) : undefined;

  useEffect(() => {
    const loadAttachments = async () => {
      if (!action.attachments || action.attachments.length === 0) return;

      try {
        const urlPromises = action.attachments.map(async (path) => {
          try {
            const url = await getAttachmentUrl(path);
            return { path, url };
          } catch (error) {
            console.error(`Erro ao carregar URL para anexo ${path}:`, error);
            return { path, url: '' };
          }
        });

        const urls = await Promise.all(urlPromises);
        setAttachmentUrls(urls.filter((u) => u.url));
      } catch (error) {
        console.error('Erro ao carregar URLs de anexos:', error);
      }
    };

    if (open && action) {
      loadAttachments();
    }
  }, [action, open, getAttachmentUrl]);

  const getResponsibleName = (id: string) => {
    const responsible = responsibles.find((r) => r.id === id);
    return responsible ? responsible.name : 'Não atribuído';
  };

  const getClientName = (id?: string) => {
    if (!id) return 'Não especificado';
    const client = clients.find((c) => c.id === id);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getCompanyName = (id: string) => {
    const company = companies.find((c) => c.id === id);
    return company ? company.name : 'Empresa não encontrada';
  };

  const getRequesterName = (id?: string) => {
    if (!id) return 'Não especificado';
    const requester = responsibles.find((r) => r.id === id);
    return requester ? requester.name : 'Solicitante não encontrado';
  };

  const handleSendNotification = async (type: 'email' | 'whatsapp' | 'sms') => {
    if (!responsible) {
      toast.error("Não foi possível enviar notificação", {
        description: "Nenhum responsável encontrado para esta ação."
      });
      return;
    }
    
    const success = await sendActionNotification(
      responsible,
      requester,
      `Lembrete: Ação "${action.subject}"`,
      `Esta é uma notificação sobre a ação "${action.subject}" que foi atribuída a você.\n\nDescrição: ${action.description}\n\nData de término: ${format(new Date(action.endDate), 'dd/MM/yyyy', { locale: ptBR })}`,
      type
    );
    
    if (success) {
      toast.success(`${type === 'email' ? 'Email' : type === 'whatsapp' ? 'WhatsApp' : 'SMS'} enviado com sucesso!`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Aprovação
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAttachmentFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return 'excel';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else {
      return 'other';
    }
  };

  const getFileName = (filePath: string) => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };

  const handleDownload = (url: string, filename: string = 'arquivo') => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Visualização de Ação</DialogTitle>
          <DialogDescription>Detalhes completos da ação</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">{action.subject}</h2>
              <div className="mt-2">{getStatusBadge(action.status)}</div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSendNotification('email')}
                className="flex items-center gap-1"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSendNotification('whatsapp')}
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSendNotification('sms')}
                className="flex items-center gap-1"
              >
                <Phone className="h-4 w-4 mr-1" />
                SMS
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
              >
                <FileText className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Informações da Ação */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Ação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold">Empresa</h4>
                    <p>{getCompanyName(action.companyId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold">Cliente</h4>
                    <p>{getClientName(action.clientId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold">Responsável</h4>
                    <p>{getResponsibleName(action.responsibleId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold">Solicitante</h4>
                    <p>{getRequesterName(action.requesterId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold">Criado por</h4>
                    <p>{action.createdByName || user?.name || "Sistema"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold">Data de Criação</h4>
                    <p>{format(new Date(action.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold">Data de Início</h4>
                    <p>{format(new Date(action.startDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold">Data de Término</h4>
                    <p>{format(new Date(action.endDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                </div>
                {action.completedAt && (
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <div>
                      <h4 className="text-sm font-semibold">Concluído em</h4>
                      <p>
                        {format(new Date(action.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
                {action.approved && (
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <div>
                      <h4 className="text-sm font-semibold">Aprovado em</h4>
                      <p>
                        {action.approvedAt 
                          ? format(new Date(action.approvedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Aprovado'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold">Descrição</h4>
                <p className="whitespace-pre-line">{action.description || "Sem descrição disponível."}</p>
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          {action.attachments && action.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Anexos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachmentUrls.map((item, index) => {
                    const fileType = getAttachmentFileType(item.url);
                    const fileName = getFileName(item.path);
                    return (
                      <div key={index} className="flex items-center justify-between border p-3 rounded">
                        <div className="flex items-center space-x-2">
                          {fileType === 'image' && (
                            <img
                              src={item.url}
                              alt={fileName}
                              className="h-8 w-8 object-cover rounded"
                            />
                          )}
                          <span className="text-sm truncate max-w-[150px]">{fileName}</span>
                        </div>
                        <div className="flex space-x-1">
                          {fileType === 'image' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(item.url, '_blank')}
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(item.url, fileName)}
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anotações */}
          <Card>
            <CardHeader>
              <CardTitle>Anotações</CardTitle>
            </CardHeader>
            <CardContent>
              {action.notes && action.notes.filter(n => !n.isDeleted).length > 0 ? (
                <div className="space-y-4">
                  {action.notes
                    .filter(note => !note.isDeleted)
                    .map(note => (
                      <div key={note.id} className="border p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">
                            {format(new Date(note.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {note.createdBy === user?.id && (
                            <Badge variant="outline">Sua anotação</Badge>
                          )}
                          {note.createdByName && (
                            <span className="text-xs text-gray-500">
                              Por: {note.createdByName}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-line">{note.content}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Nenhuma anotação encontrada para esta ação.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 print:hidden">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActionView;
