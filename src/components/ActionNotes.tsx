
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActions } from '@/contexts/ActionContext';
import { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash, Upload, X, Paperclip, FileImage, FileText, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface ActionNotesProps {
  action: Action;
  onClose?: () => void;
  onComplete?: () => void;
}

const ActionNotes: React.FC<ActionNotesProps> = ({ action, onClose, onComplete }) => {
  const { user } = useAuth();
  const { addActionNote, deleteActionNote, addAttachment } = useActions();
  const [newNote, setNewNote] = useState('');
  const [isAttachmentRequired, setIsAttachmentRequired] = useState(action.status === 'concluido');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      attachmentUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [attachmentUrls]);

  useEffect(() => {
    if (isCompleting && (newNote.trim().length === 0 && attachmentUrls.length === 0)) {
      toast({
        title: "Atenção",
        description: "Adicione uma anotação ou anexo para concluir esta ação.",
        variant: "default",
      });
    }
  }, [isCompleting, newNote, attachmentUrls.length, toast]);

  const handleAddNote = () => {
    if (!newNote.trim() && attachmentUrls.length === 0) {
      toast({
        title: "Erro",
        description: "A anotação não pode estar vazia. Adicione texto ou um anexo.",
        variant: "destructive",
      });
      return;
    }

    try {
      addActionNote(action.id, newNote);
      
      attachmentUrls.forEach(url => {
        try {
          addAttachment(action.id, url);
        } catch (attachError) {
          console.error("Erro ao adicionar anexo:", attachError);
          toast({
            title: "Erro com anexo",
            description: "Houve um problema ao salvar um anexo. Tente novamente.",
            variant: "destructive",
          });
        }
      });
      
      setNewNote('');
      setUploadedFiles([]);
      setAttachmentUrls([]);

      toast({
        title: "Anotação adicionada",
        description: "A anotação foi adicionada com sucesso.",
        variant: "default",
      });

      if (isCompleting && onComplete) {
        setIsCompleting(false);
        
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error("Erro ao adicionar anotação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a anotação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteAction = () => {
    setIsCompleting(true);
    
    if (newNote.trim() || attachmentUrls.length > 0) {
      handleAddNote();
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta anotação?')) {
      try {
        deleteActionNote(noteId, action.id);
      } catch (error) {
        console.error("Erro ao excluir anotação:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a anotação. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const newFiles = Array.from(e.target.files);
        
        const totalSize = newFiles.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 5 * 1024 * 1024) {
          toast({
            title: "Arquivos muito grandes",
            description: "O tamanho total dos arquivos excede 5MB. Escolha arquivos menores.",
            variant: "destructive",
          });
          return;
        }
        
        setUploadedFiles(prev => [...prev, ...newFiles]);
        
        const newAttachments = newFiles.map(file => 
          URL.createObjectURL(file)
        );
        
        setAttachmentUrls(prev => [...prev, ...newAttachments]);
      } catch (fileError) {
        console.error("Erro ao processar arquivos:", fileError);
        toast({
          title: "Erro",
          description: "Não foi possível processar os arquivos selecionados.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    try {
      const newFiles = [...uploadedFiles];
      const newAttachments = [...attachmentUrls];
      
      URL.revokeObjectURL(newAttachments[index]);
      
      newFiles.splice(index, 1);
      newAttachments.splice(index, 1);
      
      setUploadedFiles(newFiles);
      setAttachmentUrls(newAttachments);
    } catch (error) {
      console.error("Erro ao remover arquivo:", error);
    }
  };

  const getFileIcon = (file: File) => {
    const fileType = file.type.split('/')[0];
    switch (fileType) {
      case 'image':
        return <FileImage className="h-4 w-4 mr-2 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };
  
  const handleDownload = (url: string, filename: string = 'arquivo') => {
    try {
      // Criar um elemento <a> invisível
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      
      // Limpar depois de um breve intervalo para garantir que o download seja iniciado
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

  const visibleNotes = action.notes.filter(note => !note.isDeleted);

  const hasNoteOrAttachment = newNote.trim().length > 0 || attachmentUrls.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
        {visibleNotes.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nenhuma anotação para esta ação.</p>
        ) : (
          visibleNotes.map(note => (
            <div 
              key={note.id} 
              className="p-3 rounded-md bg-gray-50 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="text-sm text-gray-500">
                  {format(new Date(note.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                {user?.role === 'master' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-6 w-6 text-red-500 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="mt-1 whitespace-pre-line">{note.content}</div>
            </div>
          ))
        )}

        {action.attachments && action.attachments.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <h4 className="text-sm font-semibold mb-2">Anexos:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {action.attachments.map((url, index) => (
                <div key={index} className="border rounded-md p-2 flex flex-col items-center">
                  {url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <img 
                      src={url} 
                      alt={`Anexo ${index + 1}`} 
                      className="max-h-32 object-contain mb-1" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-blue-500 mb-1" />
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleDownload(url, `anexo-${index+1}`)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Baixar anexo {index + 1}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Adicionar uma anotação..."
          className="min-h-[100px] mb-2"
        />
        
        <div className="mb-4">
          <Label className="block mb-2">Anexos</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            <div 
              className="border-2 border-dashed rounded-md p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors duration-150 flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center">
                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">Enviar arquivos</p>
              </div>
            </div>
            
            <div 
              className="border-2 border-dashed rounded-md p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors duration-150 flex-1"
              onClick={handleCameraCapture}
            >
              <div className="flex flex-col items-center">
                <Camera className="h-6 w-6 text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">Tirar foto</p>
              </div>
            </div>
          </div>
          
          <input
            type="file"
            id="notes-file-upload"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept=".png,.jpg,.jpeg,.pdf,.docx,.xlsx"
          />
          
          <input
            type="file"
            id="camera-capture"
            ref={cameraInputRef}
            className="hidden"
            capture="environment"
            accept="image/*"
            onChange={handleFileChange}
          />

          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium">Arquivos selecionados:</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <div className="flex items-center">
                    {getFileIcon(file)}
                    <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Fechar
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddNote}
              variant="outline"
            >
              Adicionar Anotação
            </Button>
            {action.status !== 'concluido' && (
              <Button 
                onClick={handleCompleteAction}
                variant="default"
              >
                Concluir Ação
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionNotes;
