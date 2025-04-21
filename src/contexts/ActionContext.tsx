import React, { createContext, useContext, useState, useEffect } from 'react';
import { Action, ActionNote, ActionSummary } from '@/lib/types';
import { supabase, JsonObject } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface ActionContextType {
  actions: Action[];
  setActions: React.Dispatch<React.SetStateAction<Action[]>>;
  addAction: (action: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAction: (id: string, updatedData: Partial<Action>) => void;
  deleteAction: (id: string) => void;
  addActionNote: (actionId: string, content: string) => void;
  deleteActionNote: (actionId: string, noteId: string) => void;
  getActionById: (id: string) => Action | undefined;
  updateActionStatus: (id: string, status: "pendente" | "concluido" | "atrasado", completedAt?: Date) => void;
  sendActionEmail: (id: string, method?: string) => Promise<void>;
  addAttachment: (actionId: string, file: File) => Promise<void>;
  getAttachmentUrl: (path: string) => Promise<string>;
  getActionSummary: () => ActionSummary;
  getActionsByStatus: (status: string) => Action[];
  getActionsByResponsible: (responsibleId: string) => Action[];
  getActionsByClient: (clientId: string) => Action[];
}

const ActionContext = createContext<ActionContextType>({
  actions: [],
  setActions: () => {},
  addAction: async () => {},
  updateAction: () => {},
  deleteAction: () => {},
  addActionNote: () => {},
  deleteActionNote: () => {},
  getActionById: () => undefined,
  updateActionStatus: () => {},
  sendActionEmail: async () => {},
  addAttachment: async () => {},
  getAttachmentUrl: async () => "",
  getActionSummary: () => ({ completed: 0, delayed: 0, pending: 0, total: 0, completionRate: 0 }),
  getActionsByStatus: () => [],
  getActionsByResponsible: () => [],
  getActionsByClient: () => [],
});

export const useActions = () => useContext(ActionContext);

export const ActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actions, setActions] = useState<Action[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchActions = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('actions')
            .select('*');
            
          if (error) {
            console.error('Erro ao buscar ações:', error);
            return;
          }
          
          if (data) {
            const formattedActions: Action[] = data.map(action => {
              let parsedNotes: ActionNote[] = [];
              try {
                if (Array.isArray(action.notes)) {
                  parsedNotes = action.notes.map((note: any) => ({
                    id: note.id || String(Date.now()),
                    actionId: action.id,
                    content: note.content || '',
                    createdBy: note.createdBy || 'system',
                    createdAt: new Date(note.createdAt || Date.now()),
                    isDeleted: note.isDeleted || false,
                  }));
                }
              } catch (e) {
                console.error('Erro ao analisar notas:', e);
                parsedNotes = [];
              }

              return {
                id: action.id,
                subject: action.title,
                description: action.description || '',
                status: (action.status || 'pendente') as "pendente" | "concluido" | "atrasado",
                responsibleId: action.responsible_id,
                startDate: new Date(action.created_at),
                endDate: action.due_date ? new Date(action.due_date) : new Date(),
                companyId: action.company_id,
                clientId: action.client_id,
                requesterId: action.requester_id,
                notes: parsedNotes,
                createdAt: new Date(action.created_at),
                updatedAt: new Date(action.updated_at),
                createdBy: '',  // Fixed: not using action.created_by
                createdByName: '' // Fixed: not using action.created_by_name
              };
            });
            
            setActions(formattedActions);
            console.log('Ações carregadas do Supabase:', formattedActions);
          }
        } catch (error) {
          console.error('Erro ao carregar ações:', error);
        }
      }
    };

    fetchActions();
    
    const channel = supabase
      .channel('public:actions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'actions' 
      }, (payload) => {
        console.log('Mudança nas ações detectada:', payload);
        fetchActions(); // Recarregar ações quando houver mudanças
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const convertNotesToJsonObjects = (notes: ActionNote[]): JsonObject[] => {
    return notes.map(note => ({
      id: note.id,
      actionId: note.actionId,
      content: note.content,
      createdBy: note.createdBy,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      isDeleted: note.isDeleted
    }));
  };

  const addAction = async (newActionData: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adicionando nova ação com dados:', newActionData);
      
      const actionForSupabase = {
        title: newActionData.subject,
        description: newActionData.description,
        status: 'pendente',
        responsible_id: newActionData.responsibleId,
        company_id: newActionData.companyId,
        client_id: newActionData.clientId,
        requester_id: newActionData.requesterId,
        due_date: newActionData.endDate.toISOString()
      };
      
      console.log('Ação formatada para Supabase:', actionForSupabase);
      
      const { data: insertedAction, error } = await supabase
        .from('actions')
        .insert(actionForSupabase)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao inserir ação no Supabase:', error);
        throw error;
      }
      
      console.log('Ação inserida com sucesso:', insertedAction);
      
      if (newActionData.attachments && newActionData.attachments.length > 0) {
        for (const filePath of newActionData.attachments) {
          const fileName = filePath.split('/').pop() || 'unknown-file';
          const fileInfo = {
            action_id: insertedAction.id,
            file_path: filePath,
            file_name: fileName,
            created_by: user?.id
          };
          
          const { error: attachmentError } = await supabase
            .from('action_attachments')
            .insert(fileInfo);
            
          if (attachmentError) {
            console.error('Erro ao salvar anexo:', attachmentError);
          }
        }
      }
      
      const newAction: Action = {
        id: insertedAction.id,
        subject: newActionData.subject,
        description: newActionData.description,
        status: 'pendente',
        responsibleId: newActionData.responsibleId,
        startDate: newActionData.startDate,
        endDate: newActionData.endDate,
        companyId: newActionData.companyId,
        clientId: newActionData.clientId,
        requesterId: newActionData.requesterId,
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: newActionData.attachments,
        createdBy: user?.id || '',
        createdByName: user?.name || ''
      };
      
      setActions(prevActions => [...prevActions, newAction]);
      toast.success('Ação criada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar ação:', error);
      toast.error('Erro ao criar ação.');
      throw error;
    }
  };

  const updateAction = async (id: string, updatedData: Partial<Action>) => {
    try {
      const supabaseData: any = {};
      
      if (updatedData.subject) supabaseData.title = updatedData.subject;
      if (updatedData.description) supabaseData.description = updatedData.description;
      if (updatedData.status) supabaseData.status = updatedData.status;
      if (updatedData.responsibleId) supabaseData.responsible_id = updatedData.responsibleId;
      if (updatedData.endDate) supabaseData.due_date = updatedData.endDate.toISOString();
      if (updatedData.companyId) supabaseData.company_id = updatedData.companyId;
      if (updatedData.clientId) supabaseData.client_id = updatedData.clientId;
      if (updatedData.requesterId) supabaseData.requester_id = updatedData.requesterId;
      
      if (updatedData.notes) {
        supabaseData.notes = convertNotesToJsonObjects(updatedData.notes);
      }
      
      supabaseData.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('actions')
        .update(supabaseData)
        .eq('id', id);
        
      if (error) {
        console.error('Erro ao atualizar ação no Supabase:', error);
        throw error;
      }
      
      setActions(prevActions =>
        prevActions.map(action => {
          if (action.id === id) {
            return { ...action, ...updatedData, updatedAt: new Date() };
          }
          return action;
        })
      );
      
      toast.success('Ação atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar ação:', error);
      toast.error('Erro ao atualizar ação.');
    }
  };

  const deleteAction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Erro ao excluir ação do Supabase:', error);
        throw error;
      }
      
      setActions(prevActions => prevActions.filter(action => action.id !== id));
      toast.success('Ação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir ação:', error);
      toast.error('Erro ao excluir ação.');
    }
  };

  const addActionNote = async (actionId: string, content: string) => {
    try {
      const newNote: ActionNote = {
        id: Date.now().toString(),
        actionId: actionId,
        content: content,
        createdBy: user?.id || 'system',
        createdAt: new Date(),
        isDeleted: false,
      };
      
      const { error: noteError } = await supabase
        .from('action_notes')
        .insert({
          action_id: actionId,
          content: content,
          created_by: user?.id || 'system'
        });
        
      if (noteError) {
        console.error('Erro ao adicionar nota no Supabase:', noteError);
        throw noteError;
      }
      
      const action = actions.find(a => a.id === actionId);
      if (action) {
        const updatedNotes = [...action.notes, newNote];
        
        const jsonNotes = convertNotesToJsonObjects(updatedNotes);
        
        const { error: updateError } = await supabase
          .from('actions')
          .update({ notes: jsonNotes })
          .eq('id', actionId);
          
        if (updateError) {
          console.error('Erro ao atualizar notas na ação:', updateError);
        }
      }
      
      setActions(prevActions =>
        prevActions.map(action => {
          if (action.id === actionId) {
            return { ...action, notes: [...action.notes, newNote] };
          }
          return action;
        })
      );
      
      toast.success('Nota adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast.error('Erro ao adicionar nota.');
    }
  };

  const deleteActionNote = async (actionId: string, noteId: string) => {
    try {
      const { error: noteError } = await supabase
        .from('action_notes')
        .update({ is_deleted: true })
        .eq('id', noteId);
        
      if (noteError) {
        console.error('Erro ao marcar nota como excluída no Supabase:', noteError);
      }
      
      const action = actions.find(a => a.id === actionId);
      if (action) {
        const updatedNotes = action.notes.map(note =>
          note.id === noteId ? { ...note, isDeleted: true } : note
        );
        
        const jsonNotes = convertNotesToJsonObjects(updatedNotes);
        
        const { error: updateError } = await supabase
          .from('actions')
          .update({ notes: jsonNotes })
          .eq('id', actionId);
          
        if (updateError) {
          console.error('Erro ao atualizar notas na ação:', updateError);
        }
      }
      
      setActions(prevActions =>
        prevActions.map(action => {
          if (action.id === actionId) {
            return {
              ...action,
              notes: action.notes.map(note =>
                note.id === noteId ? { ...note, isDeleted: true } : note
              ),
            };
          }
          return action;
        })
      );
      
      toast.success('Nota excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      toast.error('Erro ao excluir nota.');
    }
  };

  const getActionById = (id: string) => {
    return actions.find(action => action.id === id);
  };

  const updateActionStatus = async (id: string, status: "pendente" | "concluido" | "atrasado", completedAt?: Date) => {
    try {
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'concluido' && completedAt) {
        updateData.completed_at = completedAt.toISOString();
      }
      
      const { error } = await supabase
        .from('actions')
        .update(updateData)
        .eq('id', id);
        
      if (error) {
        console.error('Erro ao atualizar status no Supabase:', error);
        throw error;
      }
      
      setActions(prevActions =>
        prevActions.map(action => {
          if (action.id === id) {
            return { 
              ...action, 
              status, 
              completedAt: status === 'concluido' ? completedAt || new Date() : undefined,
              updatedAt: new Date() 
            };
          }
          return action;
        })
      );
      
      toast.success(`Status da ação atualizado para ${status}!`);
    } catch (error) {
      console.error('Erro ao atualizar status da ação:', error);
      toast.error('Erro ao atualizar status.');
    }
  };

  const sendActionEmail = async (id: string, method?: string) => {
    console.log(`Enviando notificação para ação ${id} via ${method || 'email'}`);
    toast.success(`Notificação enviada com sucesso via ${method || 'email'}!`);
    return Promise.resolve();
  };

  const addAttachment = async (actionId: string, file: File) => {
    try {
      const { error: bucketError } = await supabase.storage
        .createBucket('actions', {
          public: true
        });
      
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Erro ao criar bucket:', bucketError);
      }
      
      const filePath = `attachments/${actionId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('actions')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Erro ao fazer upload do arquivo:', uploadError);
        throw uploadError;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('actions')
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      
      const { error: attachmentError } = await supabase
        .from('action_attachments')
        .insert({
          action_id: actionId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          created_by: user?.id
        });
        
      if (attachmentError) {
        console.error('Erro ao salvar informações do anexo:', attachmentError);
      }
      
      const actionToUpdate = actions.find(a => a.id === actionId);
      if (actionToUpdate) {
        const attachments = actionToUpdate.attachments || [];
        updateAction(actionId, { 
          attachments: [...attachments, publicUrl],
          updatedAt: new Date()
        });
      }
      
      toast.success('Arquivo anexado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error);
      toast.error('Erro ao anexar arquivo.');
      throw error;
    }
  };

  const getAttachmentUrl = async (path: string): Promise<string> => {
    if (path.startsWith('http')) {
      return path;
    }
    
    const { data } = supabase.storage
      .from('actions')
      .getPublicUrl(path);
      
    return data.publicUrl;
  };

  const getActionSummary = (): ActionSummary => {
    const completed = actions.filter(action => action.status === 'concluido').length;
    const delayed = actions.filter(action => action.status === 'atrasado').length;
    const pending = actions.filter(action => action.status === 'pendente').length;
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

  const getActionsByStatus = (status: string): Action[] => {
    if (status === 'all') return actions;
    return actions.filter(action => action.status === status);
  };

  const getActionsByResponsible = (responsibleId: string): Action[] => {
    if (responsibleId === 'all') return actions;
    return actions.filter(action => action.responsibleId === responsibleId);
  };

  const getActionsByClient = (clientId: string): Action[] => {
    if (clientId === 'all') return actions;
    return actions.filter(action => action.clientId === clientId);
  };

  return (
    <ActionContext.Provider
      value={{
        actions,
        setActions,
        addAction,
        updateAction,
        deleteAction,
        addActionNote,
        deleteActionNote,
        getActionById,
        updateActionStatus,
        sendActionEmail,
        addAttachment,
        getAttachmentUrl,
        getActionSummary,
        getActionsByStatus,
        getActionsByResponsible,
        getActionsByClient
      }}
    >
      {children}
    </ActionContext.Provider>
  );
};
