
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Action } from '@/lib/types';
import { useMessaging } from '@/services/messaging'; 
import { useNotifications } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';

interface ActionNotificationProps {
  action: Action;
  onClose?: () => void;
}

const ActionNotification: React.FC<ActionNotificationProps> = ({ action, onClose }) => {
  const [notifyRequester, setNotifyRequester] = useState(false);
  const [notifyResponsible, setNotifyResponsible] = useState(false);
  const [notifyCreator, setNotifyCreator] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { sendInternalNotification } = useNotifications();
  const { sendActionNotification } = useMessaging();
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!notifyRequester && !notifyResponsible && !notifyCreator) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }

    if (!notificationMessage.trim()) {
      toast.error("Digite uma mensagem para enviar");
      return;
    }

    setIsSending(true);

    try {
      // Preparar lista de destinatários
      const recipients = [];
      let success = false;

      // Log action data to help debug
      console.log("Dados da ação para notificação:", {
        actionId: action.id,
        responsibleId: action.responsibleId,
        requesterId: action.requesterId,
        createdBy: action.createdBy
      });

      // Notificar responsável
      if (notifyResponsible && action.responsibleId) {
        try {
          console.log("Tentando enviar notificação para o responsável:", action.responsibleId);
          const result = await sendInternalNotification(
            action.responsibleId,
            user?.id || undefined,
            `Notificação sobre ação: ${action.subject}`,
            notificationMessage,
            action.id,
            'acao'
          );
          if (result) {
            success = true;
            recipients.push('responsável');
          }
        } catch (err) {
          console.error("Erro ao notificar responsável:", err);
        }
      }

      // Notificar solicitante
      if (notifyRequester && action.requesterId) {
        try {
          console.log("Tentando enviar notificação para o solicitante:", action.requesterId);
          const result = await sendInternalNotification(
            action.requesterId,
            user?.id || undefined,
            `Notificação sobre ação: ${action.subject}`,
            notificationMessage,
            action.id,
            'acao'
          );
          if (result) {
            success = true;
            recipients.push('solicitante');
          }
        } catch (err) {
          console.error("Erro ao notificar solicitante:", err);
        }
      }

      // Notificar criador
      if (notifyCreator && action.createdBy) {
        try {
          console.log("Tentando enviar notificação para o criador:", action.createdBy);
          const result = await sendInternalNotification(
            action.createdBy,
            user?.id || undefined,
            `Notificação sobre ação: ${action.subject}`,
            notificationMessage,
            action.id,
            'acao'
          );
          if (result) {
            success = true;
            recipients.push('criador');
          }
        } catch (err) {
          console.error("Erro ao notificar criador:", err);
        }
      }

      if (success) {
        toast.success('Notificação enviada com sucesso', {
          description: `Enviado para: ${recipients.join(', ')}`
        });
        setNotificationMessage('');
        if (onClose) onClose();
      } else {
        toast.error('Falha ao enviar notificação', {
          description: 'Verifique se os destinatários selecionados existem'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2 flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Enviar Notificação
        </h3>
        <p className="text-sm text-gray-500">
          Selecione quem será notificado e escreva uma mensagem.
        </p>
      </div>
      
      <div className="grid gap-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="notify-responsible"
            checked={notifyResponsible}
            onCheckedChange={(checked) => setNotifyResponsible(checked === true)}
          />
          <Label htmlFor="notify-responsible">Notificar Responsável</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="notify-requester"
            checked={notifyRequester}
            onCheckedChange={(checked) => setNotifyRequester(checked === true)}
          />
          <Label htmlFor="notify-requester">Notificar Solicitante</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="notify-creator"
            checked={notifyCreator}
            onCheckedChange={(checked) => setNotifyCreator(checked === true)}
          />
          <Label htmlFor="notify-creator">Notificar Criador</Label>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notification-message">Mensagem</Label>
        <Textarea
          id="notification-message"
          placeholder="Digite sua mensagem para os destinatários..."
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      
      <Button 
        onClick={handleSendNotification}
        className="w-full"
        disabled={isSending || !notificationMessage.trim() || (!notifyRequester && !notifyResponsible && !notifyCreator)}
      >
        {isSending ? 'Enviando...' : 'Enviar Notificação'}
      </Button>
    </div>
  );
};

export default ActionNotification;
