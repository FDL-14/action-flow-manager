
import { Responsible } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface SendEmailParams {
  to: string[];
  subject: string;
  content: string;
}

// Implementation using Resend API
export const useEmail = () => {
  const { toast } = useToast();
  const RESEND_API_KEY = "re_Wam1nCv4_PbZdfrtTt9ig9B6f4YsVB294";

  const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
    try {
      console.log("Sending email with Resend:", params);
      
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev", // Default sender from Resend
          to: params.to,
          subject: params.subject,
          html: params.content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao enviar email");
      }

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
