
import { useState, useEffect } from 'react';
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
import { UserRound, Trash2, Upload, Paperclip } from 'lucide-react';
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
  const { addActionNote, deleteActionNote, addAttachment } = useActions();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(action.status !== 'concluido');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  const visibleNotes = action.notes.filter(note => !note.isDeleted);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para adicionar anotações.",
        variant: "destructive",
      });
      return;
    }

    try {
      addActionNote(action.id, data.content);
      form.reset();
      
      // Se tiver adicionado anotação e a ação não estiver concluída, 
      // mostra o botão de marcar como concluída
      if (action.status !== 'concluido') {
        setShowCompleteButton(true);
      }
    } catch (error) {
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
      // Simular um upload para ambiente de desenvolvimento
      // Em produção, aqui seria feito o upload para um servidor real
      const fileURL = URL.createObjectURL(selectedFile);
      
      // Adiciona o arquivo à lista de anexos da ação
      addAttachment(action.id, fileURL);
      
      // Atualiza a lista local de arquivos anexados
      setUploadedFiles(prev => [...prev, fileURL]);
      
      // Limpa a seleção de arquivo
      setSelectedFile(null);

      // Se tiver feito upload de arquivos, mostra o botão de marcar como concluída
      if (action.status !== 'concluido') {
        setShowCompleteButton(true);
      }
      
      toast({
        title: "Arquivo anexado",
        description: "O arquivo foi anexado com sucesso.",
        variant: "default",
      });
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

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta anotação?")) {
      deleteActionNote(noteId, action.id);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
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
                  {note.createdBy === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
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
          <div className="grid grid-cols-2 gap-2">
            {action.attachments.map((url, index) => (
              <div key={index} className="text-xs flex items-center p-1 border rounded">
                <Paperclip className="h-3 w-3 mr-1 text-gray-500" />
                <span className="truncate">Anexo {index + 1}</span>
              </div>
            ))}
          </div>
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
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {isUploading ? 'Enviando...' : 'Enviar'}
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
            variant="success" 
            onClick={handleComplete} 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            type="button"
          >
            Marcar Ação como Concluída
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActionNotes;
