
import { Responsible } from '@/lib/types';
import { toast } from 'sonner';
import { useEmail } from './email';
import { useNotifications } from './notifications';
import { useAuth } from '@/contexts/AuthContext';

export const useMessaging = () => {
  const { sendEmail } = useEmail();
  const { sendInternalNotification } = useNotifications();
  const { user } = useAuth();
  
  const sendActionNotification = async (
    responsible: Responsible,
    requester?: Responsible,
    subject?: string,
    description?: string,
    notificationType?: 'email' | 'sms' | 'whatsapp' | 'internal'
  ) => {
    try {
      console.log("Iniciando envio de notificação:", {
        responsible,
        requester,
        subject,
        notificationType
      });
      
      // Verificando dados de destinatários
      if (!responsible) {
        console.warn("Responsável não encontrado");
        toast.error("Faltam dados do responsável para enviar notificação");
        return false;
      }
      
      // Se for especificado um tipo específico de notificação
      if (notificationType) {
        console.log(`Enviando notificação via ${notificationType}`);
        
        switch (notificationType) {
          case 'email':
            // Enviar apenas e-mail
            if (!responsible.email) {
              console.warn("Responsável sem e-mail");
              toast.error("Responsável não possui e-mail para envio de notificação");
              return false;
            }
            
            const recipients = [responsible.email];
            if (requester?.email) {
              recipients.push(requester.email);
            }
            
            const emailSent = await sendEmail({
              to: recipients,
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
              toast.success("E-mail enviado com sucesso!");
            }
            
            return emailSent;
            
          case 'sms':
            // Simulação de envio de SMS - será implementado futuramente
            if (!responsible.phone) {
              console.warn("Responsável sem telefone");
              toast.error("Responsável não possui telefone para envio de SMS");
              return false;
            }
            
            console.log("Simulando envio de SMS para:", responsible.phone);
            toast.success("SMS enviado com sucesso! (simulado)");
            return true;
            
          case 'whatsapp':
            // Simulação de envio de WhatsApp - será implementado futuramente
            if (!responsible.phone) {
              console.warn("Responsável sem telefone");
              toast.error("Responsável não possui telefone para envio de WhatsApp");
              return false;
            }
            
            console.log("Simulando envio de WhatsApp para:", responsible.phone);
            toast.success("Mensagem WhatsApp enviada com sucesso! (simulado)");
            return true;
            
          case 'internal':
            // Enviar notificação interna no sistema
            // Verificar se o responsável tem um ID de usuário associado
            if (!responsible.userId) {
              console.warn("Responsável não está associado a um usuário do sistema");
              toast.error("Não foi possível enviar notificação interna - responsável não é um usuário do sistema");
              return false;
            }
            
            const remetente = user?.id || undefined;
            
            const internalSent = await sendInternalNotification(
              responsible.userId,
              remetente,
              subject || "Nova ação atribuída a você",
              description || 'Uma nova ação foi atribuída a você no sistema. Por favor, verifique.',
              undefined,
              'acao'
            );
            
            if (internalSent) {
              toast.success("Notificação interna enviada com sucesso!");
              
              // Se houver um solicitante que também é usuário do sistema, enviar para ele também
              if (requester?.userId && requester.userId !== responsible.userId) {
                await sendInternalNotification(
                  requester.userId,
                  remetente,
                  `Ação atribuída a ${responsible.name}`,
                  description || `Uma ação foi atribuída a ${responsible.name}. Você está configurado como solicitante.`,
                  undefined,
                  'acao'
                );
              }
            }
            
            return internalSent;
        }
      }
      
      // Caso padrão: enviar todas as notificações disponíveis
      console.log("Enviando todas as notificações disponíveis");
      let successCount = 0;
      let notificationsSent = [];
      
      // Send email if email is available
      if (responsible.email) {
        const recipients = [responsible.email];
        if (requester?.email) {
          recipients.push(requester.email);
        }
        
        const emailSent = await sendEmail({
          to: recipients,
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
          successCount++;
          notificationsSent.push("email");
        }
      }
      
      // Send internal notification if user account is linked
      if (responsible.userId) {
        const remetente = user?.id || undefined;
        
        const internalSent = await sendInternalNotification(
          responsible.userId,
          remetente,
          subject || "Nova ação atribuída a você",
          description || 'Uma nova ação foi atribuída a você no sistema. Por favor, verifique.',
          undefined,
          'acao'
        );
        
        if (internalSent) {
          successCount++;
          notificationsSent.push("notificação interna");
          
          // Se houver um solicitante que também é usuário do sistema, enviar para ele também
          if (requester?.userId && requester.userId !== responsible.userId) {
            await sendInternalNotification(
              requester.userId,
              remetente,
              `Ação atribuída a ${responsible.name}`,
              description || `Uma ação foi atribuída a ${responsible.name}. Você está configurado como solicitante.`,
              undefined,
              'acao'
            );
          }
        }
      }
      
      if (successCount > 0) {
        toast.success(`Notificações enviadas com sucesso!`, {
          description: `Enviado via: ${notificationsSent.join(", ")}`
        });
        return true;
      } else {
        toast.error("Nenhuma notificação enviada", {
          description: "Não foi possível enviar notificações. Verifique os dados do responsável."
        });
        return false;
      }
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
      toast.error("Erro ao enviar notificações", {
        description: "Houve um problema ao enviar as notificações. Tente novamente."
      });
      return false;
    }
  };

  return {
    sendActionNotification,
    sendEmail
  };
};
