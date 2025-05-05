
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { useActions } from '@/contexts/ActionContext';
import { Action } from '@/lib/types';
import { toast } from 'sonner';
import { useNotifications } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';

interface CompleteActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: Action;
  onComplete?: () => void;
}

const CompleteActionDialog = ({
  open,
  onOpenChange,
  action,
  onComplete
}: CompleteActionDialogProps) => {
  const { updateAction } = useActions();
  const { sendApprovalNotification } = useNotifications();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!completionNotes.trim()) {
      toast.error("Justificativa obrigatória", {
        description: "Por favor, adicione uma justificativa antes de marcar como concluído"
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar se existe um solicitante para aprovar
      if (!action.requesterId) {
        toast.error("Não é possível concluir", {
          description: "Esta ação não possui um solicitante definido para aprovação."
        });
        return;
      }

      // Add a note with completion justification
      const noteContent = `[CONCLUSÃO] ${completionNotes}`;
      const updatedNotes = [
        ...(action.notes || []),
        {
          id: Date.now().toString(),
          actionId: action.id,
          content: noteContent,
          createdBy: user?.id || 'system',
          createdByName: user?.name || 'Sistema',
          createdAt: new Date(),
          isDeleted: false,
        }
      ];

      // Update the action to "awaiting approval" status
      await updateAction(action.id, {
        status: 'aguardando_aprovacao',
        notes: updatedNotes,
        completionNotes: completionNotes
      });
      
      // Enviar notificação para o solicitante
      if (action.requesterId) {
        await sendApprovalNotification(
          action.requesterId,
          user?.id,
          action.id,
          action.subject
        );
      }
      
      toast.success("Ação enviada para aprovação", {
        description: "A ação foi marcada como concluída e está aguardando aprovação do solicitante"
      });
      
      if (onComplete) {
        onComplete();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao marcar ação como concluída:', error);
      toast.error("Erro ao concluir ação", {
        description: "Não foi possível marcar esta ação como concluída. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (newFiles: FileList | null) => {
    if (newFiles) {
      setFiles(Array.from(newFiles));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-center">Marcar Ação como Concluída</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 rounded-md p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p>Esta ação só será marcada como concluída após a aprovação do solicitante.</p>
              <p className="mt-1">Adicione uma justificativa e os anexos necessários para a aprovação.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completionNotes" className="text-sm font-medium">
              Justificativa/Anotações <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="completionNotes"
              placeholder="Descreva detalhadamente como a ação foi realizada..."
              rows={5}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="resize-none"
              required
            />
            <p className="text-xs text-gray-500">Estas informações serão enviadas para aprovação do solicitante.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Anexos</Label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesChange(e.target.files)}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="rounded-full bg-gray-100 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500">Arraste e solte arquivos aqui, ou clique para selecionar</span>
                <span className="text-xs text-gray-400">Formatos aceitos: PNG, JPG, PDF, DOCX, XLSX. Máx. 5 arquivos.</span>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Arquivos selecionados:</p>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !completionNotes.trim()}>
              {loading ? 'Enviando...' : 'Enviar para aprovação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteActionDialog;
