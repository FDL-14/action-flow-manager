
import { toast } from "sonner";

interface SendEmailParams {
  to: string[];
  subject: string;
  content: string;
}

// Configuração do TurboSMTP
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

      // Preparar os dados para o TurboSMTP
      const emailData = {
        from: "contato@meusaas.com",
        to: params.to.join(","),
        subject: params.subject,
        html: params.content,
      };

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

      if (!response.ok) {
        throw new Error(`Erro ao enviar email: ${response.statusText}`);
      }

      console.log("Email enviado com sucesso via TurboSMTP");
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
