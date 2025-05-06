
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useActions } from '@/contexts/ActionContext';
import { toast } from 'sonner';
import { useNotifications } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';

interface CompleteActionDialogProps {
  actionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CompleteActionDialog: React.FC<CompleteActionDialogProps> = ({ 
  actionId, 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateAction, getActionById } = useActions();
  const { sendApprovalNotification } = useNotifications();
  const { user } = useAuth();

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const action = getActionById(actionId);
      if (!action) {
        toast.error('Ação não encontrada');
        return;
      }

      // Marcar a ação como aguardando aprovação
      await updateAction(actionId, {
        status: 'aguardando_aprovacao',
        completionNotes: notes,
        completedAt: new Date()
      });

      toast.success('Ação marcada como concluída', {
        description: 'Aguardando aprovação do solicitante.'
      });

      // Se tiver solicitante, enviar notificação de aprovação
      if (action.requesterId) {
        await sendApprovalNotification(
          action.requesterId,
          user?.id,
          actionId,
          action.subject
        );
      }

      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao concluir ação:', error);
      toast.error('Erro ao concluir ação', { 
        description: 'Não foi possível marcar a ação como concluída.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir Ação</DialogTitle>
          <DialogDescription>
            A ação será marcada como concluída e enviada para aprovação do solicitante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="completion-notes">Observações de conclusão</Label>
            <Textarea
              id="completion-notes"
              placeholder="Descreva o que foi feito ou adicione informações relevantes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Concluir e Enviar para Aprovação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteActionDialog;
