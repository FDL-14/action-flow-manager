
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/lib/types";
import { toast } from "sonner";

export interface InternalNotification {
  id: string;
  destinatario_id: string;
  remetente_id?: string;
  titulo: string;
  conteudo: string;
  referencia_id?: string;
  tipo_referencia?: string;
  lida: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const useNotifications = () => {
  const sendInternalNotification = async (
    destinatarioId: string,
    remetenteId: string | undefined,
    titulo: string,
    conteudo: string,
    referenciaId?: string,
    tipoReferencia?: string
  ) => {
    try {
      console.log("Enviando notificação interna:", {
        destinatario_id: destinatarioId,
        remetente_id: remetenteId,
        titulo,
        conteudo,
        referencia_id: referenciaId,
        tipo_referencia: tipoReferencia
      });

      // Make sure both IDs are valid UUIDs
      if (!destinatarioId) {
        console.error("ID de destinatário inválido (vazio)");
        return false;
      }
      
      // Convert simple IDs to UUIDs if they're not in UUID format
      const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(destinatarioId)) {
        console.error("ID de destinatário não está no formato UUID:", destinatarioId);
        
        // Try to format as UUID if it's a simple ID
        if (/^[0-9]+$/.test(destinatarioId)) {
          destinatarioId = `00000000-0000-0000-0000-${destinatarioId.padStart(12, '0')}`;
          console.log("ID de destinatário formatado para UUID:", destinatarioId);
        } else {
          return false;
        }
      }

      const { data, error } = await supabase
        .from('notificacoes_internas')
        .insert({
          destinatario_id: destinatarioId,
          remetente_id: remetenteId,
          titulo,
          conteudo,
          referencia_id: referenciaId,
          tipo_referencia: tipoReferencia,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao enviar notificação interna:", error);
        toast.error("Erro ao enviar notificação interna", {
          description: error.message
        });
        return false;
      }

      console.log("Notificação interna enviada com sucesso:", data);
      return true;
    } catch (error) {
      console.error("Erro ao enviar notificação interna:", error);
      toast.error("Erro ao enviar notificação interna");
      return false;
    }
  };

  const getNotifications = async (userId: string): Promise<InternalNotification[]> => {
    try {
      const { data, error } = await supabase
        .from('notificacoes_internas')
        .select('*')
        .eq('destinatario_id', userId)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error("Erro ao buscar notificações:", error);
        return [];
      }

      return data as InternalNotification[];
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return [];
    }
  };

  const getUnreadCount = async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('notificacoes_internas')
        .select('*', { count: 'exact', head: true })
        .eq('destinatario_id', userId)
        .eq('lida', false);

      if (error) {
        console.error("Erro ao contar notificações não lidas:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      return 0;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes_internas')
        .update({ lida: true, atualizado_em: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return false;
    }
  };

  const markAllAsRead = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes_internas')
        .update({ lida: true, atualizado_em: new Date().toISOString() })
        .eq('destinatario_id', userId)
        .eq('lida', false);

      if (error) {
        console.error("Erro ao marcar todas as notificações como lidas:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes_internas')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error("Erro ao excluir notificação:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
      return false;
    }
  };

  // Nova função para enviar notificação de aprovação
  const sendApprovalNotification = async (
    destinatarioId: string,
    remetenteId: string | undefined,
    actionId: string,
    actionTitle: string
  ) => {
    return await sendInternalNotification(
      destinatarioId,
      remetenteId,
      `Ação aguardando aprovação: ${actionTitle}`,
      `A ação "${actionTitle}" foi marcada como concluída e está aguardando sua aprovação. Por favor, verifique os detalhes e aprove ou reprove.`,
      actionId,
      'acao'
    );
  };

  return {
    sendInternalNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendApprovalNotification
  };
};
