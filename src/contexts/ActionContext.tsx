
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

  // Load actions from Supabase on initial load
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
            // Transform the data to match our Action type
            const formattedActions: Action[] = data.map(action => {
              // Parse notes - ensure it's converted to ActionNote[] format
              let parsedNotes: ActionNote[] = [];
              try {
                // Check if notes is an array and has items
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
                createdBy: action.created_by || '', // Handle missing field
                createdByName: action.created_by_name || '' // Handle missing field
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
      
      // Format the action data for Supabase
      const actionForSupabase = {
        title: newActionData.subject,
        description: newActionData.description,
        status: 'pendente',
        responsible_id: newActionData.responsibleId,
        company_id: newActionData.companyId,
        client_id: newActionData.clientId,
        requester_id: newActionData.requesterId,
        due_date: newActionData.endDate.toISOString(),
        // Use empty keys if these fields don't exist in the Supabase 'actions' table schema
        created_by: user?.id || '',
        created_by_name: user?.name || ''
      };
      
      console.log('Formatted action for Supabase:', actionForSupabase);
      
      // Insert action into Supabase
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
      
      // Handle file uploads for attachments if any
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
      
      // Create new action with correct type
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
      
      // Update the local state
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
    // Implement actual email sending logic here
    toast.success(`Notificação enviada com sucesso via ${method || 'email'}!`);
    return Promise.resolve();
  };

  const addAttachment = async (actionId: string, file: File) => {
    try {
      const filePath = `attachments/${actionId}/${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('actions')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('actions')
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      
      // Save attachment info to action
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
    // If it's already a public URL, just return it
    if (path.startsWith('http')) {
      return path;
    }
    
    // Otherwise, get the public URL from storage
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
