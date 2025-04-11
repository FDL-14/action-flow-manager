
import { Responsible } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface SendEmailParams {
  to: string[];
  subject: string;
  content: string;
}

// Implementação usando a API MailJet
export const useEmail = () => {
  const { toast } = useToast();
  const MAILJET_API_KEY = "f623ce2a2d37c50777d898bf684a52fa";

  const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
    try {
      console.log("Enviando e-mail com MailJet:", params);
      
      // Verificar se há destinatários
      if (!params.to || params.to.length === 0) {
        toast({
          title: "Erro ao enviar email",
          description: "Nenhum destinatário especificado",
          variant: "destructive",
        });
        return false;
      }

      // Transformar os destinatários no formato esperado pelo MailJet
      const recipients = params.to.map(email => ({
        Email: email
      }));

      const response = await fetch("https://api.mailjet.com/v3.1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${MAILJET_API_KEY}:`)}`
        },
        body: JSON.stringify({
          Messages: [
            {
              From: {
                Email: "no-reply@totaldata.com.br",
                Name: "Gerenciador de Ações - Total Data"
              },
              To: recipients,
              Subject: params.subject,
              HTMLPart: params.content
            }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Erro na resposta da API MailJet:", data);
        throw new Error(data.message || "Erro ao enviar email");
      }

      console.log("Email enviado com sucesso:", data);

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
