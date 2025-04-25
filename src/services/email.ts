
import { toast } from "sonner";

interface SendEmailParams {
  to: string[];
  subject: string;
  content: string;
}

// Configuração do TurboSMTP com as chaves fornecidas
const TURBOSMTP_API_KEY = "39665192b1b3fb2c07ef80191dd453b3";
const TURBOSMTP_SECRET = "REcMTn7ru018aSj4GHZytx3v6bWhPpmB";
const TURBOSMTP_ENDPOINT = "https://api.turbo-smtp.com/v1/email/send";

export const useEmail = () => {
  const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
    try {
      console.log("Enviando e-mail via TurboSMTP:", params);
      
      // Verificar se há destinatários
      if (!params.to || params.to.length === 0) {
        toast.error("Nenhum destinatário especificado");
        return false;
      }

      // Filtrar e-mails vazios ou inválidos
      const validEmails = params.to.filter(email => 
        email && email.trim() !== '' && email.includes('@')
      );
      
      if (validEmails.length === 0) {
        console.warn("Não há e-mails válidos para envio");
        toast.error("Não há e-mails válidos para envio");
        return false;
      }

      // Preparar os dados para o TurboSMTP
      const emailData = {
        from: "contato@totaldata.com.br",
        to: validEmails.join(","),
        subject: params.subject,
        html: params.content,
        app_name: "Totaldata_Gerenciamento_de_Ações"
      };

      console.log("Dados do e-mail:", emailData);
      console.log("Endpoint:", TURBOSMTP_ENDPOINT);
      console.log("API Key:", TURBOSMTP_API_KEY.substring(0, 5) + "...");

      // Enviar e-mail usando TurboSMTP
      const response = await fetch(TURBOSMTP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": TURBOSMTP_API_KEY,
          "X-API-Secret": TURBOSMTP_SECRET,
        },
        body: JSON.stringify(emailData),
      });

      console.log("Status da resposta:", response.status);
      
      const responseText = await response.text();
      console.log("Resposta completa:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Erro ao analisar resposta JSON:", e);
        responseData = { error: "Formato de resposta inválido" };
      }

      if (!response.ok) {
        console.error("Erro na resposta do TurboSMTP:", responseData);
        throw new Error(`Erro ao enviar email: ${response.statusText || responseData.error || 'Erro desconhecido'}`);
      }

      console.log("Email enviado com sucesso via TurboSMTP:", responseData);
      toast.success("Email enviado com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar email. Tente novamente mais tarde.");
      return false;
    }
  };

  return { sendEmail };
};
