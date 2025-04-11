
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
  const MAILJET_SECRET_KEY = ""; // Segundo parâmetro vazio, pois estamos usando apenas a API key

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

      // Usando uma API proxy que não tenha bloqueios CORS
      // Como o MailJet tem bloqueios CORS no browser, usamos o serviço EmailJS como alternativa
      // para o ambiente de desenvolvimento/teste
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: "default_service",
          template_id: "template_default",
          user_id: MAILJET_API_KEY,
          template_params: {
            to_email: params.to.join(","),
            subject: params.subject,
            message_html: params.content,
            from_name: "Gerenciador de Ações - Total Data",
            from_email: "no-reply@totaldata.com.br"
          }
        })
      });

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        let errorMessage = "Erro ao enviar email";
        try {
          const errorData = await response.text();
          console.error("Erro na resposta da API de email:", errorData);
          errorMessage = `Erro: ${errorData || response.statusText}`;
        } catch (e) {
          console.error("Erro ao processar resposta de erro:", e);
        }
        
        throw new Error(errorMessage);
      }

      console.log("Email enviado com sucesso!");

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
