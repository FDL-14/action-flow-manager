
import { Responsible } from '@/lib/types';
import { toast } from 'sonner';
import { useEmail } from './email';
import { useActions } from '@/contexts/ActionContext';
import { useEffect } from 'react';

export const useMessaging = () => {
  const { sendEmail } = useEmail();
  const { actions } = useActions();
  
  const sendActionNotification = async (
    responsible: Responsible,
    requester?: Responsible,
    subject?: string,
    description?: string
  ) => {
    try {
      // Send email using our email service
      const emailSent = await sendEmail({
        to: [responsible.email, ...(requester?.email ? [requester.email] : [])],
        subject: subject || "Nova ação atribuída a você",
        content: `
          <h2>Olá ${responsible.name},</h2>
          <p>${requester ? requester.name : 'O sistema'} atribuiu uma nova ação para você:</p>
          <h3>${subject || 'Nova ação'}</h3>
          <p>${description || 'Uma nova ação foi atribuída a você no sistema. Por favor, verifique.'}</p>
          <p>Acesse o sistema para mais detalhes.</p>
          <p>Atenciosamente,<br>Total Data</p>
        `
      });
      
      if (emailSent) {
        toast.success("Notificações enviadas com sucesso!", {
          description: "Email enviado para o responsável e solicitante."
        });
      }
      
      return emailSent;
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
      toast.error("Erro ao enviar notificações", {
        description: "Houve um problema ao enviar as notificações. Tente novamente."
      });
      return false;
    }
  };

  const sendDeadlineNotification = async (action: any) => {
    try {
      const recipients = [action.responsible?.email];
      if (action.requester?.email) {
        recipients.push(action.requester.email);
      }

      await sendEmail({
        to: recipients,
        subject: `Alerta: Ação "${action.subject}" próxima do prazo`,
        content: `
          <h2>Alerta de Prazo</h2>
          <p>A ação "${action.subject}" está próxima do prazo de conclusão.</p>
          <p><strong>Descrição:</strong> ${action.description}</p>
          <p><strong>Data de término:</strong> ${new Date(action.endDate).toLocaleString('pt-BR')}</p>
          <p>Por favor, verifique a ação no sistema e tome as providências necessárias.</p>
          <p>Atenciosamente,<br>Total Data</p>
        `
      });
    } catch (error) {
      console.error("Erro ao enviar notificação de prazo:", error);
    }
  };

  // Check for actions near deadline
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      
      actions.forEach(action => {
        if (action.status === 'pendente') {
          const endDate = new Date(action.endDate);
          const timeDiff = endDate.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // Check if action is 24 hours from deadline
          if (hoursDiff <= 24 && hoursDiff > 23) {
            console.log('Sending 24h notification for action:', action.subject);
            sendDeadlineNotification(action);
          }
          
          // Check if action is 1 hour from deadline
          if (hoursDiff <= 1 && hoursDiff > 0) {
            console.log('Sending 1h notification for action:', action.subject);
            sendDeadlineNotification(action);
          }
        }
      });
    };

    // Check deadlines every 15 minutes
    const interval = setInterval(checkDeadlines, 15 * 60 * 1000);
    
    // Initial check
    checkDeadlines();
    
    return () => clearInterval(interval);
  }, [actions]);

  return {
    sendActionNotification,
    sendEmail,
  };
};
