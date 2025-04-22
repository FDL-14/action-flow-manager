
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useActions } from '@/contexts/ActionContext';
import { Action } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { UserRound, Trash2, Upload, Paperclip, ExternalLink, File, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  content: z.string().min(10, {
    message: 'A anotação deve ter pelo menos 10 caracteres',
  }),
});

interface ActionNotesProps {
  action: Action;
  onClose: () => void;
  onComplete?: () => void;
}

const ActionNotes: React.FC<ActionNotesProps> = ({ action, onClose, onComplete }) => {
  const { user } = useAuth();
  const { addActionNote, deleteActionNote, addAttachment, getAttachmentUrl, updateActionStatus } = useActions();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(action.status !== 'concluido');
  const [addedNoteOrAttachment, setAddedNoteOrAttachment] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<{ path: string, url: string }[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isCompletingAction, setIsCompletingAction] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  const visibleNotes = action.notes.filter(note => !note.isDeleted);

  useEffect(() => {
    const loadAttachmentUrls = async () => {
      if (!action.attachments || action.attachments.length === 0) return;
      
      setIsLoadingAttachments(true);
      try {
        console.log('Carregando URLs para anexos:', action.attachments);
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
        console.log('URLs de anexos carregadas:', urls);
        setAttachmentUrls(urls.filter(u => u.url));
      } catch (error) {
        console.error("Erro ao carregar URLs de anexos:", error);
        toast({
          title: "Erro ao carregar anexos",
          description: "Não foi possível carregar os anexos. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAttachments(false);
      }
    };
    
    loadAttachmentUrls();
  }, [action.attachments, getAttachmentUrl, toast]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para adicionar anotações.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adicionando anotação para ação', action.id, 'com conteúdo:', data.content);
      await addActionNote(action.id, data.content);
      form.reset();
      
      if (action.status !== 'concluido') {
        setShowCompleteButton(true);
      }
      
      // Marca que o usuário adicionou uma anotação nesta sessão
      setAddedNoteOrAttachment(true);
      
      toast({
        title: "Anotação adicionada",
        description: "Sua anotação foi adicionada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
      toast({
        title: "Erro ao adicionar anotação",
        description: "Não foi possível adicionar a anotação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      console.log('Arquivo selecionado:', files[0].name);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo para anexar.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('Enviando arquivo:', selectedFile.name, 'para ação:', action.id);
      await addAttachment(action.id, selectedFile);
      toast({
        title: "Arquivo anexado",
        description: "O arquivo foi anexado com sucesso.",
      });
      setSelectedFile(null);

      if (action.status !== 'concluido') {
        setShowCompleteButton(true);
      }
      
      // Marca que o usuário adicionou um anexo nesta sessão
      setAddedNoteOrAttachment(true);
      
      // Recarregar URLs de anexos após o upload ser concluído
      if (action.attachments && action.attachments.length > 0) {
        setIsLoadingAttachments(true);
        try {
          const urlPromises = action.attachments.map(async (path) => {
            const url = await getAttachmentUrl(path);
            return { path, url };
          });
          
          const urls = await Promise.all(urlPromises);
          setAttachmentUrls(urls);
        } catch (error) {
          console.error("Erro ao recarregar URLs de anexos:", error);
        } finally {
          setIsLoadingAttachments(false);
        }
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro ao anexar arquivo",
        description: "Não foi possível anexar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta anotação?")) {
      try {
        setIsDeletingNote(noteId);
        console.log("Excluindo anotação:", noteId, "da ação:", action.id);
        await deleteActionNote(noteId, action.id);
        
        toast({
          title: "Anotação excluída",
          description: "A anotação foi excluída com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao excluir anotação:", error);
        toast({
          title: "Erro ao excluir anotação",
          description: "Não foi possível excluir a anotação. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsDeletingNote(null);
      }
    }
  };

  const handleComplete = async () => {
    if (!addedNoteOrAttachment) {
      toast({
        title: "Ação incompleta",
        description: "Adicione uma anotação ou anexo antes de concluir esta ação.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCompletingAction(true);
    
    try {
      console.log('Marcando ação como concluída via handleComplete:', action.id);
      await updateActionStatus(action.id, 'concluido', new Date());
      
      toast({
        title: "Ação concluída",
        description: "A ação foi marcada como concluída com sucesso.",
      });
      
      // Chamar o callback onComplete se ele existir
      if (onComplete) {
        onComplete();
      }
      
      // Fechar o diálogo de anotações
      onClose();
    } catch (error) {
      console.error("Erro ao concluir ação:", error);
      toast({
        title: "Erro ao concluir ação",
        description: "Não foi possível marcar a ação como concluída. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCompletingAction(false);
    }
  };

  const getFileIcon = (fileUrl: string) => {
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    
    if (!extension) return <File className="h-4 w-4" />;
    
    // Verificar tipo de arquivo por extensão
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return <img src={fileUrl} alt="Miniatura" className="h-8 w-8 object-cover rounded" />;
    }
    
    if (['pdf'].includes(extension)) {
      return <File className="h-4 w-4 text-red-500" />;
    }
    
    if (['doc', 'docx'].includes(extension)) {
      return <File className="h-4 w-4 text-blue-500" />;
    }
    
    if (['xls', 'xlsx'].includes(extension)) {
      return <File className="h-4 w-4 text-green-500" />;
    }
    
    return <File className="h-4 w-4" />;
  };

  const getFileName = (filePath: string) => {
    // Extrai o nome do arquivo da URL ou do caminho
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };

  const canDeleteNote = (noteCreatedBy: string) => {
    if (!user) return false;
    
    // O próprio criador da anotação pode excluí-la
    if (noteCreatedBy === user.id) return true;
    
    // Usuários com permissão de administrador podem excluir qualquer anotação
    if (user.role === 'master') return true;
    
    // Verificar se o usuário tem permissão específica para excluir anotações
    const hasDeletePermission = user.permissions?.some(p => p.canDelete);
    
    return hasDeletePermission || false;
  };

  return (
    <div className="space-y-4">
      {visibleNotes.length === 0 ? (
        <div className="text-center text-gray-500 my-4">
          Nenhuma anotação encontrada para esta ação.
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {visibleNotes.map((note) => (
            <Card key={note.id} className="bg-gray-50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserRound className="h-4 w-4 mr-1" />
                    <span>
                      {note.createdBy === user?.id ? 'Você' : 'Usuário'}
                    </span>
                    <span className="mx-1">•</span>
                    <span>
                      {format(new Date(note.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {canDeleteNote(note.createdBy) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      disabled={isDeletingNote === note.id}
                    >
                      {isDeletingNote === note.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-line">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {action.attachments && action.attachments.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Anexos ({action.attachments.length})</h3>
          {isLoadingAttachments ? (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando anexos...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {attachmentUrls.map((item, index) => (
                <a 
                  key={index} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs flex items-center p-2 border rounded hover:bg-gray-50"
                >
                  {getFileIcon(item.url)}
                  <span className="ml-2 truncate flex-1">{getFileName(item.path)}</span>
                  <ExternalLink className="h-3 w-3 text-gray-500 ml-1" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Adicione uma anotação..."
                    className="resize-none min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Anexar arquivo
              </label>
              {selectedFile && (
                <div className="text-xs">
                  {selectedFile.name.length > 20
                    ? selectedFile.name.substring(0, 20) + '...'
                    : selectedFile.name}
                </div>
              )}
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="flex items-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Enviar
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </div>
        </form>
      </Form>

      {showCompleteButton && (
        <div className="pt-4 border-t mt-4">
          <Button 
            variant="default" 
            onClick={handleComplete} 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            type="button"
            disabled={!addedNoteOrAttachment || isCompletingAction}
          >
            {isCompletingAction ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Marcar Ação como Concluída'
            )}
          </Button>
          {!addedNoteOrAttachment && (
            <p className="text-xs text-center mt-2 text-amber-600">
              Adicione uma anotação ou anexo para concluir esta ação
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionNotes;
