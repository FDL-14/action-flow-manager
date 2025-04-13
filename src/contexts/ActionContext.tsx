import React, { createContext, useContext, useState, useEffect } from 'react';
import { Action, ActionNote, ActionSummary } from '@/lib/types';
import { mockActions } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { useEmail } from '@/services/email';
import { useCompany } from './CompanyContext';

interface ActionContextType {
  actions: Action[];
  getActionsByStatus: (status: 'pendente' | 'concluido' | 'atrasado' | 'all') => Action[];
  getActionsByResponsible: (responsibleId: string) => Action[];
  getActionsByClient: (clientId: string) => Action[];
  addAction: (action: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>) => void;
  updateAction: (id: string, actionData: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'>) => void;
  updateActionStatus: (id: string, status: 'pendente' | 'concluido' | 'atrasado', completedAt?: Date) => void;
  addActionNote: (actionId: string, content: string) => void;
  deleteActionNote: (actionNoteId: string, actionId: string) => void;
  addAttachment: (actionId: string, attachment: string) => void;
  getActionSummary: () => ActionSummary;
  sendActionEmail: (actionId: string) => Promise<void>;
  deleteAction: (id: string) => void;
}

const ActionContext = createContext<ActionContextType>({
  actions: [],
  getActionsByStatus: () => [],
  getActionsByResponsible: () => [],
  getActionsByClient: () => [],
  addAction: () => {},
  updateAction: () => {},
  updateActionStatus: () => {},
  addActionNote: () => {},
  deleteActionNote: () => {},
  addAttachment: () => {},
  getActionSummary: () => ({ completed: 0, delayed: 0, pending: 0, total: 0, completionRate: 0 }),
  sendActionEmail: async () => {},
  deleteAction: () => {},
});

export const useActions = () => useContext(ActionContext);

export const ActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actions, setActions] = useState<Action[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendActionNotification } = useEmail();
  const { responsibles } = useCompany();

  const backupActionsToLocalStorage = (actionsData: Action[]) => {
    try {
      const simplifiedActions = JSON.parse(JSON.stringify(actionsData));
      localStorage.setItem('actions_backup', JSON.stringify(simplifiedActions));
      console.log("Backup de ações criado com sucesso.");
    } catch (error) {
      console.error("Erro ao criar backup de ações:", error);
    }
  };

  useEffect(() => {
    try {
      let dataToUse: Action[] = [];
      let useBackup = false;
      
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
            console.log("Carregando ações do localStorage:", parsedActions.length);
            dataToUse = parsedActions;
          } else {
            console.log("Nenhuma ação válida encontrada no localStorage, verificando backup...");
            useBackup = true;
          }
        } catch (parseError) {
          console.error("Erro ao analisar ações:", parseError);
          useBackup = true;
        }
      } else {
        console.log("Nenhuma ação encontrada no localStorage, verificando backup...");
        useBackup = true;
      }
      
      if (useBackup) {
        const actionsBackup = localStorage.getItem('actions_backup');
        if (actionsBackup) {
          try {
            const parsedBackup = JSON.parse(actionsBackup, (key, value) => {
              const dateKeys = ['startDate', 'endDate', 'completedAt', 'createdAt', 'updatedAt'];
              if (dateKeys.includes(key) && value) {
                return new Date(value);
              }
              return value;
            });
            
            if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
              console.log("Restaurando ações do backup:", parsedBackup.length);
              dataToUse = parsedBackup;
              toast({
                title: "Dados restaurados",
                description: "As ações foram restauradas do backup.",
                variant: "default",
              });
            } else {
              console.log("Backup de ações inválido, usando dados mock");
              dataToUse = mockActions;
            }
          } catch (backupError) {
            console.error("Erro ao analisar backup de ações:", backupError);
            dataToUse = mockActions;
          }
        } else {
          console.log("Nenhum backup encontrado, usando dados mock");
          dataToUse = mockActions;
        }
      }
      
      setActions(dataToUse);
      
      if (dataToUse === mockActions) {
        localStorage.setItem('actions', JSON.stringify(mockActions));
        backupActionsToLocalStorage(mockActions);
      }
    } catch (error) {
      console.error('Erro ao analisar dados de ações:', error);
      toast({
        title: "Erro de dados",
        description: "Houve um problema ao carregar as ações. Usando dados padrão.",
        variant: "destructive",
      });
      setActions(mockActions);
      localStorage.setItem('actions', JSON.stringify(mockActions));
      backupActionsToLocalStorage(mockActions);
    }
  }, [toast]);

  useEffect(() => {
    try {
      if (actions && actions.length > 0) {
        console.log("Salvando ações no localStorage:", actions.length);
        
        const actionsToSave = JSON.parse(JSON.stringify(actions));
        localStorage.setItem('actions', JSON.stringify(actionsToSave));
        
        backupActionsToLocalStorage(actions);
      }
    } catch (error) {
      console.error('Erro ao salvar ações no localStorage:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações localmente.",
        variant: "destructive",
      });
    }
  }, [actions, toast]);

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

  const addAction = (actionData: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newAction: Action = {
      id: (actions.length + 1).toString(),
      ...actionData,
      status: 'pendente',
      notes: [],
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id,
      createdByName: user?.name
    };

    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    
    try {
      localStorage.setItem('actions', JSON.stringify(updatedActions));
      backupActionsToLocalStorage(updatedActions);
    } catch (saveError) {
      console.error("Erro ao salvar nova ação:", saveError);
    }
    
    toast({
      title: "Ação adicionada",
      description: "A nova ação foi adicionada com sucesso.",
      variant: "default",
    });
  };

  const updateAction = (id: string, actionData: Omit<Action, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'>) => {
    const updatedActions = actions.map(action => {
      if (action.id === id) {
        return {
          ...action,
          ...actionData,
          updatedAt: new Date()
        };
      }
      return action;
    });
    
    setActions(updatedActions);
    
    try {
      localStorage.setItem('actions', JSON.stringify(updatedActions));
      backupActionsToLocalStorage(updatedActions);
    } catch (saveError) {
      console.error("Erro ao salvar atualização de ação:", saveError);
    }

    toast({
      title: "Ação atualizada",
      description: "A ação foi atualizada com sucesso.",
      variant: "default",
    });
  };

  const updateActionStatus = (id: string, status: 'pendente' | 'concluido' | 'atrasado', completedAt?: Date) => {
    const updatedActions = actions.map(action => 
      action.id === id 
        ? { 
            ...action, 
            status, 
            completedAt: status === 'concluido' ? completedAt || new Date() : action.completedAt,
            updatedAt: new Date()
          } 
        : action
    );
    
    setActions(updatedActions);

    try {
      localStorage.setItem('actions', JSON.stringify(updatedActions));
      backupActionsToLocalStorage(updatedActions);
    } catch (saveError) {
      console.error("Erro ao salvar atualização de status:", saveError);
    }

    toast({
      title: "Status atualizado",
      description: `O status da ação foi atualizado para ${status}.`,
      variant: "default",
    });
  };

  const addActionNote = (actionId: string, content: string) => {
    if (!user) return;
    
    const newNote: ActionNote = {
      id: Date.now().toString(),
      actionId,
      content,
      createdBy: user.id,
      createdAt: new Date(),
      isDeleted: false
    };

    const updatedActions = actions.map(action => 
      action.id === actionId 
        ? { 
            ...action, 
            notes: [...action.notes, newNote],
            updatedAt: new Date()
          } 
        : action
    );
    
    setActions(updatedActions);

    try {
      localStorage.setItem('actions', JSON.stringify(updatedActions));
      backupActionsToLocalStorage(updatedActions);
    } catch (saveError) {
      console.error("Erro ao salvar nova nota:", saveError);
    }

    toast({
      title: "Anotação adicionada",
      description: "A anotação foi adicionada com sucesso.",
      variant: "default",
    });
  };

  const deleteActionNote = (actionNoteId: string, actionId: string) => {
    setActions(prevActions => 
      prevActions.map(action => 
        action.id === actionId 
          ? { 
              ...action, 
              notes: action.notes.map(note => 
                note.id === actionNoteId 
                  ? { ...note, isDeleted: true } 
                  : note
              ),
              updatedAt: new Date()
            } 
          : action
      )
    );

    toast({
      title: "Anotação removida",
      description: "A anotação foi removida com sucesso.",
      variant: "destructive",
    });
  };

  const addAttachment = (actionId: string, attachment: string) => {
    setActions(prevActions => 
      prevActions.map(action => 
        action.id === actionId 
          ? { 
              ...action, 
              attachments: [...(action.attachments || []), attachment],
              updatedAt: new Date()
            } 
          : action
      )
    );

    toast({
      title: "Anexo adicionado",
      description: "O arquivo foi anexado com sucesso.",
      variant: "default",
    });
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

  const sendActionEmail = async (actionId: string) => {
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
      await sendActionNotification(
        responsible,
        requester,
        action.subject,
        action.description
      );
    } catch (error) {
      console.error("Error sending action email:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const deleteAction = (id: string) => {
    if (!user || user.role !== 'master') {
      toast({
        title: "Permissão negada",
        description: "Apenas administradores podem excluir ações.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedActions = actions.filter(action => action.id !== id);
    setActions(updatedActions);
    
    try {
      localStorage.setItem('actions', JSON.stringify(updatedActions));
      backupActionsToLocalStorage(updatedActions);
    } catch (saveError) {
      console.error("Erro ao salvar após exclusão de ação:", saveError);
    }

    toast({
      title: "Ação excluída",
      description: "A ação foi excluída permanentemente.",
      variant: "default",
    });
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
      deleteAction
    }}>
      {children}
    </ActionContext.Provider>
  );
};
