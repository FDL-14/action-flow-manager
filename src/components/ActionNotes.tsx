
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActions } from '@/contexts/ActionContext';
import { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash, Upload, X, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface ActionNotesProps {
  action: Action;
  onClose?: () => void;
}

const ActionNotes: React.FC<ActionNotesProps> = ({ action, onClose }) => {
  const { user } = useAuth();
  const { addActionNote, deleteActionNote, addAttachment } = useActions();
  const [newNote, setNewNote] = useState('');
  const [isAttachmentRequired, setIsAttachmentRequired] = useState(action.status === 'concluido');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAddNote = () => {
    if (!newNote.trim() && attachmentUrls.length === 0) {
      toast({
        title: "Erro",
        description: "A anotação não pode estar vazia. Adicione texto ou um anexo.",
        variant: "destructive",
      });
      return;
    }

    // Add the note
    addActionNote(action.id, newNote);
    
    // Add all attachments
    attachmentUrls.forEach(url => {
      addAttachment(action.id, url);
    });
    
    // Reset form
    setNewNote('');
    setUploadedFiles([]);
    setAttachmentUrls([]);

    // Show success message
    toast({
      title: "Anotação adicionada",
      description: "A anotação foi adicionada com sucesso.",
      variant: "default",
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta anotação?')) {
      deleteActionNote(noteId, action.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Simulate file URLs for the mock attachments
      const newAttachments = newFiles.map(file => 
        URL.createObjectURL(file)
      );
      
      setAttachmentUrls(prev => [...prev, ...newAttachments]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    const newAttachments = [...attachmentUrls];
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newAttachments[index]);
    
    newFiles.splice(index, 1);
    newAttachments.splice(index, 1);
    
    setUploadedFiles(newFiles);
    setAttachmentUrls(newAttachments);
  };

  // Filter out deleted notes
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
          <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors duration-150">
            <input
              type="file"
              id="notes-file-upload"
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            <label htmlFor="notes-file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">
                  Enviar arquivos ou arraste e solte
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, PDF, DOCX e XLSX
                </p>
              </div>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <div className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
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
          <Button 
            onClick={handleAddNote}
            disabled={isAttachmentRequired && !hasNoteOrAttachment}
          >
            Adicionar Anotação
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActionNotes;
