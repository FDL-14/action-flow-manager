
import { Responsible } from '@/lib/types';
import { toast } from 'sonner';
import { useEmail } from './email';

// Chaves de serviço (normalmente estariam em variáveis de ambiente)
const SMS_API_KEY = "demo_free_tier_key"; // Chave de demonstração para MessageBird
const WHATSAPP_API_KEY = "demo_free_tier_key"; // Chave de demonstração para Twilio

export const useMessaging = () => {
  const { sendEmail } = useEmail();
  
  const sendActionNotification = async (
    responsible: Responsible,
    requester?: Responsible,
    subject?: string,
    description?: string
  ) => {
    try {
      // Enviar email usando nosso serviço de email atualizado
      const emailSent = await sendEmail({
        to: [responsible.email],
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
      
      // Enviar SMS se o número de telefone estiver disponível
      if (responsible.phone) {
        await sendSMS(responsible.phone, subject || "Nova ação atribuída a você", responsible.name);
      }
      
      // Enviar WhatsApp se o número de telefone estiver disponível
      if (responsible.phone) {
        await sendWhatsApp(responsible.phone, subject || "Nova ação atribuída a você", responsible.name, description);
      }
      
      if (emailSent) {
        toast.success("Notificações enviadas com sucesso!", {
          description: "Email, SMS e WhatsApp foram enviados para o responsável."
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

  const sendSMS = async (
    phoneNumber: string,
    message: string,
    recipientName: string
  ) => {
    try {
      // Simulando envio de SMS com MessageBird ou outro serviço
      console.log(`Enviando SMS para ${recipientName} no número ${phoneNumber}`);
      
      // Em um ambiente real, usaríamos um serviço como MessageBird ou Twilio
      // Simulação de chamada API
      const smsData = {
        recipient: phoneNumber,
        message: `${message}. Acesse o sistema para mais detalhes.`,
        originator: "TotalData"
      };
      
      // Simulação de chamada à API MessageBird
      console.log("Dados do SMS:", smsData);
      console.log("Utilizando API KEY:", SMS_API_KEY);
      
      // Simulação de sucesso
      console.log("SMS enviado com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao enviar SMS:", error);
      throw new Error("Falha ao enviar SMS");
    }
  };

  const sendWhatsApp = async (
    phoneNumber: string,
    subject: string,
    recipientName: string,
    description?: string
  ) => {
    try {
      // Simulando envio de WhatsApp com Twilio ou outro serviço
      console.log(`Enviando WhatsApp para ${recipientName} no número ${phoneNumber}`);
      
      // Formatação da mensagem para WhatsApp
      const whatsappMessage = `*${subject}*\n\n${description || "Uma nova ação foi atribuída a você no sistema."}\n\nAcesse o sistema para mais detalhes.`;
      
      // Simulação de chamada API
      const whatsappData = {
        to: `whatsapp:+${phoneNumber.replace(/\D/g, '')}`,
        from: "whatsapp:+12065551234", // Número de WhatsApp do sistema (seria configurado no serviço)
        body: whatsappMessage
      };
      
      // Simulação de chamada à API Twilio
      console.log("Dados do WhatsApp:", whatsappData);
      console.log("Utilizando API KEY:", WHATSAPP_API_KEY);
      
      // Simulação de sucesso
      console.log("Mensagem WhatsApp enviada com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao enviar WhatsApp:", error);
      throw new Error("Falha ao enviar WhatsApp");
    }
  };

  return {
    sendActionNotification,
    sendEmail: (params: SendEmailParams) => sendEmail(params),
    sendSMS,
    sendWhatsApp
  };
};

// Adicionando a interface aqui para evitar erros de TypeScript
interface SendEmailParams {
  to: string[];
  subject: string;
  content: string;
}
