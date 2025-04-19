
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Action, ActionNote, ActionSummary } from '@/lib/types';
import { mockActions } from '@/lib/mock-data';
import { supabase } from '@/integrations/supabase/client';
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
            console.error('Error fetching actions:', error);
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
                console.error('Error parsing notes:', e);
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
                // Since these fields don't exist in the Supabase actions table, use default empty string
                createdBy: '',  // Fixed: not using action.created_by
                createdByName: '' // Fixed: not using action.created_by_name
              };
            });
            
            setActions(formattedActions);
            console.log('Actions loaded from Supabase:', formattedActions);
          }
        } catch (error) {
          console.error('Error loading actions:', error);
        }
      }
    };

    fetchActions();
  }, [user]);

  const addAction = async (newActionData: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding new action with data:', newActionData);
      
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
      
      console.log('Formatted action for Supabase:', actionForSupabase);
      
      const { data: insertedAction, error } = await supabase
        .from('actions')
        .insert(actionForSupabase)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting action into Supabase:', error);
        throw error;
      }
      
      console.log('Action inserted successfully:', insertedAction);
      
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
            console.error('Error saving attachment:', attachmentError);
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
      console.error('Error adding action:', error);
      toast.error('Erro ao criar ação.');
      throw error;
    }
  };

  const updateAction = (id: string, updatedData: Partial<Action>) => {
    setActions(prevActions =>
      prevActions.map(action => {
        if (action.id === id) {
          return { ...action, ...updatedData, updatedAt: new Date() };
        }
        return action;
      })
    );
  };

  const deleteAction = (id: string) => {
    setActions(prevActions => prevActions.filter(action => action.id !== id));
  };

  const addActionNote = (actionId: string, content: string) => {
    setActions(prevActions =>
      prevActions.map(action => {
        if (action.id === actionId) {
          const newNote: ActionNote = {
            id: Date.now().toString(),
            actionId: actionId,
            content: content,
            createdBy: user?.id || 'system',
            createdAt: new Date(),
            isDeleted: false,
          };
          return { ...action, notes: [...action.notes, newNote] };
        }
        return action;
      })
    );
  };

  const deleteActionNote = (actionId: string, noteId: string) => {
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
  };

  const getActionById = (id: string) => {
    return actions.find(action => action.id === id);
  };

  const updateActionStatus = (id: string, status: "pendente" | "concluido" | "atrasado", completedAt?: Date) => {
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
  };

  const sendActionEmail = async (id: string, method?: string) => {
    console.log(`Sending notification for action ${id} via ${method || 'email'}`);
    toast.success(`Notificação enviada com sucesso via ${method || 'email'}!`);
    return Promise.resolve();
  };

  const addAttachment = async (actionId: string, file: File) => {
    try {
      const filePath = `attachments/${actionId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('actions')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('actions')
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      
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
      console.error('Error adding attachment:', error);
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
