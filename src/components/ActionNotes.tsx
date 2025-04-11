
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActions } from '@/contexts/ActionContext';
import { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ActionNotesProps {
  action: Action;
}

const ActionNotes: React.FC<ActionNotesProps> = ({ action }) => {
  const { user } = useAuth();
  const { addActionNote, deleteActionNote } = useActions();
  const [newNote, setNewNote] = useState('');
  const { toast } = useToast();

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Erro",
        description: "A anotação não pode estar vazia",
        variant: "destructive",
      });
      return;
    }

    addActionNote(action.id, newNote);
    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta anotação?')) {
      deleteActionNote(noteId, action.id);
    }
  };

  // Filter out deleted notes
  const visibleNotes = action.notes.filter(note => !note.isDeleted);

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
        <Button onClick={handleAddNote}>Adicionar Anotação</Button>
      </div>
    </div>
  );
};

export default ActionNotes;
