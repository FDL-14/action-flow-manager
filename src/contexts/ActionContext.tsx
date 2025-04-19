import React, { createContext, useContext, useState, useEffect } from 'react';
import { Action, ActionNote } from '@/lib/types';
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
            const formattedActions: Action[] = data.map(action => ({
              id: action.id,
              subject: action.title,
              description: action.description || '',
              status: action.status || 'pendente',
              responsibleId: action.responsible_id,
              startDate: new Date(action.created_at),
              endDate: action.due_date ? new Date(action.due_date) : new Date(),
              companyId: action.company_id,
              clientId: action.client_id,
              requesterId: action.requester_id,
              notes: action.notes || [],
              createdAt: new Date(action.created_at),
              updatedAt: new Date(action.updated_at),
              createdBy: action.created_by,
              createdByName: action.created_by_name
            }));
            
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
        due_date: newActionData.endDate,
        created_by: user?.id,
        created_by_name: user?.name
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
        createdBy: newActionData.createdBy,
        createdByName: newActionData.createdByName
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
      }}
    >
      {children}
    </ActionContext.Provider>
  );
};
