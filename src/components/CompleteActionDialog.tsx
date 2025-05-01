
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { useActions } from '@/contexts/ActionContext';
import { Action } from '@/lib/types';
import { toast } from 'sonner';
import FileUpload from './FileUpload';

interface CompleteActionDialogProps {
  open: boolean; // Changed from isOpen to open
  onOpenChange: (open: boolean) => void; // Changed from onClose
  action: Action;
  onComplete?: () => void;
}

const CompleteActionDialog = ({
  open, // Changed from isOpen
  onOpenChange, // Changed from onClose
  action,
  onComplete
}: CompleteActionDialogProps) => {
  const { updateAction } = useActions();
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
      // First upload any files if present
      let attachments: string[] = [];
      
      // Mock file upload success - in a real implementation this would upload to storage
      if (files.length > 0) {
        toast.info("Enviando anexos...");
        // This is placeholder - in a real implementation you'd upload the files
        attachments = files.map(file => `https://example.com/files/${encodeURIComponent(file.name)}`);
      }

      // Add a note with completion justification
      const noteContent = `[CONCLUSÃO] ${completionNotes}`;
      const updatedNotes = [
        ...(action.notes || []),
        {
          id: Date.now().toString(),
          actionId: action.id,
          content: noteContent,
          createdBy: 'current-user-id', // This should be the actual user ID
          createdAt: new Date(),
          isDeleted: false,
          attachments: attachments
        }
      ];

      // Update the action to "awaiting approval" status
      await updateAction(action.id, {
        status: 'aguardando_aprovacao',
        notes: updatedNotes,
        completionNotes: completionNotes,
        attachments: [...(action.attachments || []), ...attachments]
      });
      
      toast.success("Ação enviada para aprovação", {
        description: "A ação foi marcada como concluída e está aguardando aprovação do solicitante"
      });
      
      if (onComplete) {
        onComplete();
      }
      onOpenChange(false); // Changed from onClose()
    } catch (error) {
      console.error('Erro ao marcar ação como concluída:', error);
      toast.error("Erro ao concluir ação", {
        description: "Não foi possível marcar esta ação como concluída. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
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
            <FileUpload
              onFilesChange={handleFilesChange}
              maxFiles={5}
              acceptedFileTypes={['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.xlsx']}
            />
            <p className="text-xs text-gray-500">Formatos aceitos: PNG, JPG, PDF, DOCX, XLSX. Máx. 5 arquivos.</p>
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
