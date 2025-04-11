
import { Responsible } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface SendEmailParams {
  to: string[];
  subject: string;
  content: string;
}

// Mock implementation for email service
export const useEmail = () => {
  const { toast } = useToast();

  const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
    try {
      console.log("Sending email:", params);
      
      // This is where we would integrate with Resend
      // Mock successful email sending
      toast({
        title: "Email enviado",
        description: `Email enviado com sucesso para ${params.to.join(", ")}`,
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
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
    
    // Add responsible email
    if (responsible?.email) {
      recipients.push(responsible.email);
    }
    
    // Add requester email if available
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
      <h1>Nova ação atribuída</h1>
      <p><strong>Assunto:</strong> ${subject}</p>
      <p><strong>Descrição:</strong> ${description}</p>
      <p><strong>Responsável:</strong> ${responsible.name}</p>
      ${requester ? `<p><strong>Solicitante:</strong> ${requester.name}</p>` : ''}
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
