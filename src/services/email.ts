
import { Responsible } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import emailjs from 'emailjs-com';

interface SendEmailParams {
  to: string[];
  subject: string;
  content: string;
}

// Implementação usando EmailJS como proxy para o Mailjet
export const useEmail = () => {
  const { toast } = useToast();
  const EMAILJS_SERVICE_ID = "service_3ydh0yd"; // EmailJS service ID
  const EMAILJS_TEMPLATE_ID = "template_8v9pz9l"; // EmailJS template ID  
  const EMAILJS_USER_ID = "f623ce2a2d37c50777d898bf684a52fa"; // EmailJS public key
  
  // Chaves Mailjet (usadas no backend do EmailJS)
  const MAILJET_API_KEY = "f623ce2a2d37c50777d898bf684a52fa";
  const MAILJET_SECRET_KEY = "654240a741db85b6aeead36866bc10a7";

  // Inicializar EmailJS
  emailjs.init(EMAILJS_USER_ID);

  const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
    try {
      console.log("Enviando e-mail com EmailJS/Mailjet:", params);
      
      // Verificar se há destinatários
      if (!params.to || params.to.length === 0) {
        toast({
          title: "Erro ao enviar email",
          description: "Nenhum destinatário especificado",
          variant: "destructive",
        });
        return false;
      }

      // Preparar os parâmetros para o EmailJS
      const templateParams = {
        to_email: params.to.join(","),
        subject: params.subject,
        message_html: params.content,
        from_name: "Gerenciador de Ações - Total Data",
        from_email: "contato@meusaas.com",
        // Informações do Mailjet (estas serão processadas no EmailJS)
        mailjet_api_key: MAILJET_API_KEY,
        mailjet_secret_key: MAILJET_SECRET_KEY
      };

      // Enviar e-mail usando EmailJS
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log("Email enviado com sucesso via Mailjet:", response);

      toast({
        title: "Email enviado",
        description: `Email enviado com sucesso para ${params.to.join(", ")}`,
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email. Tente novamente mais tarde.",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendActionNotification = async (
    responsible: Responsible,
    requester: Responsible | undefined,
    subject: string,
    description: string
  ): Promise<boolean> => {
    const recipients = [];
    
    // Adicionar e-mail do responsável
    if (responsible?.email) {
      recipients.push(responsible.email);
    }
    
    // Adicionar e-mail do solicitante se disponível
    if (requester?.email) {
      recipients.push(requester.email);
    }
    
    if (recipients.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há destinatários de email para esta ação.",
        variant: "default",
      });
      return false;
    }
    
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Nova ação atribuída</h1>
          </div>
          <div class="content">
            <p><strong>Assunto:</strong> ${subject}</p>
            <p><strong>Descrição:</strong> ${description}</p>
            <p><strong>Responsável:</strong> ${responsible.name}</p>
            ${requester ? `<p><strong>Solicitante:</strong> ${requester.name}</p>` : ''}
          </div>
          <div class="footer">
            <p>Este é um e-mail automático do sistema Gerenciador de Ações - Total Data.</p>
          </div>
        </body>
      </html>
    `;
    
    return sendEmail({
      to: recipients,
      subject: `Nova ação: ${subject}`,
      content: emailContent
    });
  };

  return {
    sendEmail,
    sendActionNotification
  };
};
