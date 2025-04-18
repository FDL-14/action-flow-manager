import React, { createContext, useContext, useState, useEffect } from 'react';
import { Action, ActionNote, ActionSummary, ActionAttachment } from '@/lib/types';
import { mockActions } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { useMessaging } from '@/services/messaging';
import { useCompany } from './CompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface ActionContextType {
  actions: Action[];
  getActionsByStatus: (status: 'pendente' | 'concluido' | 'atrasado' | 'all') => Action[];
  getActionsByResponsible: (responsibleId: string) => Action[];
  getActionsByClient: (clientId: string) => Action[];
  addAction: (action: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAction: (id: string, actionData: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'>) => Promise<void>;
  updateActionStatus: (id: string, status: 'pendente' | 'concluido' | 'atrasado', completedAt?: Date) => Promise<void>;
  addActionNote: (actionId: string, content: string) => Promise<void>;
  deleteActionNote: (actionNoteId: string, actionId: string) => Promise<void>;
  addAttachment: (actionId: string, file: File) => Promise<void>;
  getActionSummary: () => ActionSummary;
  sendActionEmail: (actionId: string, method?: 'email' | 'sms' | 'whatsapp') => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  isLoading: boolean;
  getAttachmentUrl: (filePath: string) => Promise<string>;
}

const ActionContext = createContext<ActionContextType>({
  actions: [],
  getActionsByStatus: () => [],
  getActionsByResponsible: () => [],
  getActionsByClient: () => [],
  addAction: async () => {},
  updateAction: async () => {},
  updateActionStatus: async () => {},
  addActionNote: async () => {},
  deleteActionNote: async () => {},
  addAttachment: async () => {},
  getActionSummary: () => ({ completed: 0, delayed: 0, pending: 0, total: 0, completionRate: 0 }),
  sendActionEmail: async () => {},
  deleteAction: async () => {},
  isLoading: false,
  getAttachmentUrl: async () => '',
});

export const useActions = () => useContext(ActionContext);

export const ActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendActionNotification, sendEmail, sendSMS, sendWhatsApp } = useMessaging();
  const { responsibles } = useCompany();

  // Função para carregar as ações do Supabase
  const fetchActions = async () => {
    try {
      setIsLoading(true);

      // Buscar todas as ações
      const { data: actionsData, error: actionsError } = await supabase
        .from('actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (actionsError) {
        throw actionsError;
      }

      // Buscar todas as notas das ações
      const { data: notesData, error: notesError } = await supabase
        .from('action_notes')
        .select('*');

      if (notesError) {
        throw notesError;
      }

      // Buscar todos os anexos
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('action_attachments')
        .select('*');

      if (attachmentsError) {
        throw attachmentsError;
      }

      // Mapeamento para o formato esperado pelo aplicativo
      const formattedActions: Action[] = actionsData.map(action => {
        // Filtrar notas relacionadas a esta ação
        const actionNotes = notesData
          .filter(note => note.action_id === action.id)
          .map(note => ({
            id: note.id,
            actionId: note.action_id,
            content: note.content,
            createdBy: note.created_by,
            createdAt: new Date(note.created_at),
            isDeleted: note.is_deleted
          }));

        // Filtrar anexos relacionados a esta ação
        const actionAttachments = attachmentsData
          .filter(attachment => attachment.action_id === action.id)
          .map(attachment => attachment.file_path);

        return {
          id: action.id,
          subject: action.subject,
          description: action.description || '',
          status: action.status as 'pendente' | 'concluido' | 'atrasado',
          responsibleId: action.responsible_id,
          startDate: new Date(action.start_date),
          endDate: new Date(action.end_date),
          companyId: action.company_id,
          clientId: action.client_id,
          requesterId: action.requester_id,
          completedAt: action.completed_at ? new Date(action.completed_at) : undefined,
          attachments: actionAttachments,
          notes: actionNotes,
          createdAt: new Date(action.created_at),
          updatedAt: new Date(action.updated_at),
          createdBy: action.created_by,
          createdByName: action.created_by_name
        };
      });

      setActions(formattedActions);
    } catch (error) {
      console.error('Erro ao carregar ações do Supabase:', error);
      
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as ações do banco de dados. Usando dados locais.",
        variant: "destructive",
      });
      
      // Carregar dados mock em caso de falha
      const savedActions = localStorage.getItem('actions');
      if (savedActions) {
        try {
          const parsedActions = JSON.parse(savedActions, (key, value) => {
            const dateKeys = ['startDate', 'endDate', 'completedAt', 'createdAt', 'updatedAt'];
            if (dateKeys.includes(key) && value) {
              return new Date(value);
            }
            return value;
          });
          
          if (Array.isArray(parsedActions) && parsedActions.length > 0) {
            setActions(parsedActions);
          } else {
            setActions(mockActions);
          }
        } catch (parseError) {
          console.error("Erro ao analisar ações locais:", parseError);
          setActions(mockActions);
        }
      } else {
        setActions(mockActions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Configurar listener para atualizações em tempo real
  useEffect(() => {
    fetchActions();

    // Configurar canais de escuta para atualizações em tempo real
    const actionsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actions',
        },
        () => {
          fetchActions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_notes',
        },
        () => {
          fetchActions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_attachments',
        },
        () => {
          fetchActions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(actionsChannel);
    };
  }, [toast]);

  const getActionsByStatus = (status: 'pendente' | 'concluido' | 'atrasado' | 'all') => {
    if (status === 'all') return actions;
    return actions.filter(action => action.status === status);
  };

  const getActionsByResponsible = (responsibleId: string) => {
    return actions.filter(action => action.responsibleId === responsibleId);
  };

  const getActionsByClient = (clientId: string) => {
    return actions.filter(action => action.clientId === clientId);
  };

  // Função para obter URL de visualização de um anexo
  const getAttachmentUrl = async (filePath: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .storage
        .from('action_attachments')
        .createSignedUrl(filePath, 60 * 60); // 1 hora de expiração
      
      if (error) {
        throw error;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Erro ao obter URL do anexo:', error);
      return '';
    }
  };

  const addAction = async (actionData: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para adicionar ações.",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = new Date();
      
      // Criar nova ação no Supabase
      const { data, error } = await supabase
        .from('actions')
        .insert({
          subject: actionData.subject,
          description: actionData.description,
          status: 'pendente',
          responsible_id: actionData.responsibleId,
          start_date: actionData.startDate.toISOString(),
          end_date: actionData.endDate.toISOString(),
          company_id: actionData.companyId,
          client_id: actionData.clientId || null,
          requester_id: actionData.requesterId,
          created_by: user.id,
          created_by_name: user.name
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }

      toast({
        title: "Ação adicionada",
        description: "A nova ação foi adicionada com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao adicionar ação:', error);
      toast({
        title: "Erro ao adicionar ação",
        description: "Não foi possível adicionar a nova ação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const updateAction = async (id: string, actionData: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'>) => {
    try {
      const { error } = await supabase
        .from('actions')
        .update({
          subject: actionData.subject,
          description: actionData.description,
          responsible_id: actionData.responsibleId,
          start_date: actionData.startDate.toISOString(),
          end_date: actionData.endDate.toISOString(),
          company_id: actionData.companyId,
          client_id: actionData.clientId || null,
          requester_id: actionData.requesterId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Ação atualizada",
        description: "A ação foi atualizada com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao atualizar ação:', error);
      toast({
        title: "Erro ao atualizar ação",
        description: "Não foi possível atualizar a ação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const updateActionStatus = async (id: string, status: 'pendente' | 'concluido' | 'atrasado', completedAt?: Date) => {
    try {
      const currentTime = new Date();
      
      const { error } = await supabase
        .from('actions')
        .update({
          status,
          completed_at: status === 'concluido' ? (completedAt || currentTime).toISOString() : null,
          updated_at: currentTime.toISOString()
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      if (status === 'concluido') {
        toast({
          title: "Ação concluída",
          description: "A ação foi marcada como concluída com sucesso.",
          variant: "default",
        });
      } else {
        toast({
          title: "Status atualizado",
          description: `O status da ação foi atualizado para ${status}.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status da ação:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da ação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const addActionNote = async (actionId: string, content: string) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para adicionar anotações.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('action_notes')
        .insert({
          action_id: actionId,
          content,
          created_by: user.id,
          is_deleted: false
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Anotação adicionada",
        description: "A anotação foi adicionada com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
      toast({
        title: "Erro ao adicionar anotação",
        description: "Não foi possível adicionar a anotação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const deleteActionNote = async (actionNoteId: string, actionId: string) => {
    try {
      // Atualizar para marcação lógica de exclusão
      const { error } = await supabase
        .from('action_notes')
        .update({ is_deleted: true })
        .eq('id', actionNoteId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Anotação removida",
        description: "A anotação foi removida com sucesso.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro ao excluir anotação:', error);
      toast({
        title: "Erro ao remover anotação",
        description: "Não foi possível remover a anotação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const addAttachment = async (actionId: string, file: File) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para adicionar anexos.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${actionId}/${fileName}`;
      
      // Upload do arquivo para o bucket do Storage
      const { error: uploadError } = await supabase
        .storage
        .from('action_attachments')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Registrar o anexo no banco de dados
      const { error: dbError } = await supabase
        .from('action_attachments')
        .insert({
          action_id: actionId,
          file_path: filePath,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          created_by: user.id
        });
      
      if (dbError) {
        throw dbError;
      }
      
      toast({
        title: "Anexo adicionado",
        description: "O arquivo foi anexado com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error);
      toast({
        title: "Erro ao anexar arquivo",
        description: "Não foi possível anexar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getActionSummary = (): ActionSummary => {
    const completed = actions.filter(a => a.status === 'concluido').length;
    const delayed = actions.filter(a => a.status === 'atrasado').length;
    const pending = actions.filter(a => a.status === 'pendente').length;
    const total = actions.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      delayed,
      pending,
      total,
      completionRate
    };
  };

  const sendActionEmail = async (actionId: string, method?: 'email' | 'sms' | 'whatsapp') => {
    const action = actions.find(a => a.id === actionId);
    if (!action) {
      toast({
        title: "Erro",
        description: "Ação não encontrada.",
        variant: "destructive",
      });
      return;
    }

    const responsible = responsibles.find(r => r.id === action.responsibleId);
    const requester = action.requesterId ? responsibles.find(r => r.id === action.requesterId) : undefined;

    if (!responsible) {
      toast({
        title: "Erro",
        description: "Responsável não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      if ((method === 'sms' || method === 'whatsapp') && !responsible.phone) {
        toast({
          title: "Aviso",
          description: `O responsável não possui telefone cadastrado para envio de ${method === 'sms' ? 'SMS' : 'WhatsApp'}.`,
          variant: "default",
        });
        return;
      }

      if (method === 'email') {
        await sendEmail(responsible, requester, action.subject, action.description);
        toast({
          title: "Email enviado",
          description: "O email foi enviado com sucesso!",
          variant: "default",
        });
      } else if (method === 'sms') {
        await sendSMS(responsible.phone!, action.subject, responsible.name);
        toast({
          title: "SMS enviado",
          description: "O SMS foi enviado com sucesso!",
          variant: "default",
        });
      } else if (method === 'whatsapp') {
        await sendWhatsApp(responsible.phone!, action.subject, responsible.name, action.description);
        toast({
          title: "WhatsApp enviado",
          description: "A mensagem de WhatsApp foi enviada com sucesso!",
          variant: "default",
        });
      } else {
        await sendActionNotification(
          responsible,
          requester,
          action.subject,
          action.description
        );
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar as notificações. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const deleteAction = async (id: string) => {
    if (!user || user.role !== 'master') {
      toast({
        title: "Permissão negada",
        description: "Apenas administradores podem excluir ações.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Apagar todos os arquivos associados a esta ação no Storage
      const { data: attachments, error: fetchError } = await supabase
        .from('action_attachments')
        .select('file_path')
        .eq('action_id', id);
        
      if (fetchError) {
        throw fetchError;
      }
      
      // Deletar arquivos do storage
      if (attachments && attachments.length > 0) {
        const filePaths = attachments.map(a => a.file_path);
        const { error: storageError } = await supabase
          .storage
          .from('action_attachments')
          .remove(filePaths);
          
        if (storageError) {
          console.error('Erro ao excluir arquivos do storage:', storageError);
        }
      }
      
      // Excluir a ação (cascade vai remover notas e referências de anexos)
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Ação excluída",
        description: "A ação foi excluída permanentemente.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao excluir ação:', error);
      toast({
        title: "Erro ao excluir ação",
        description: "Não foi possível excluir a ação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <ActionContext.Provider value={{
      actions,
      getActionsByStatus,
      getActionsByResponsible,
      getActionsByClient,
      addAction,
      updateAction,
      updateActionStatus,
      addActionNote,
      deleteActionNote,
      addAttachment,
      getActionSummary,
      sendActionEmail,
      deleteAction,
      isLoading,
      getAttachmentUrl
    }}>
      {children}
    </ActionContext.Provider>
  );
};
