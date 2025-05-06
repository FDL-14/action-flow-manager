
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Action } from '@/lib/types';
import { useActions } from '@/contexts/ActionContext';
import ActionNotes from '@/components/ActionNotes';
import EditActionForm from '@/components/EditActionForm';
import CompleteActionDialog from '@/components/CompleteActionDialog';
import DeleteActionDialog from './DeleteActionDialog';
import { Pencil, Trash2, FileText, MessageCircle, CheckCircle, Bell } from 'lucide-react';
import ActionNotification from './ActionNotification';

interface ActionViewProps {
  action: Action;
  open: boolean;
  onClose: () => void;
}

const ActionView: React.FC<ActionViewProps> = ({ action, open, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const { getActionById } = useActions();
  const [currentAction, setCurrentAction] = useState<Action>(action);
  
  useEffect(() => {
    if (open && action?.id) {
      const freshAction = getActionById(action.id);
      if (freshAction) {
        setCurrentAction(freshAction);
      }
    }
  }, [open, action, getActionById]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'atrasado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'aguardando_aprovacao':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'concluido': 'Concluído',
      'pendente': 'Pendente',
      'atrasado': 'Atrasado',
      'aguardando_aprovacao': 'Aguardando Aprovação'
    };
    
    return statusMap[status] || status;
  };
  
  const handleClose = () => {
    setActiveTab('details');
    setShowEditForm(false);
    onClose();
  };

  // Handle notes tab close
  const handleNotesClose = () => {
    setActiveTab('details');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{currentAction.subject}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="details" className="text-xs sm:text-sm">Detalhes</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">Anotações</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notificações</TabsTrigger>
            <TabsTrigger value="edit" className="text-xs sm:text-sm">Editar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <Badge className={`${getStatusColor(currentAction.status)} text-xs px-2 py-1`}>
                  {formatStatus(currentAction.status)}
                </Badge>
                <div className="flex gap-2">
                  {currentAction.status !== "concluido" && currentAction.status !== "aguardando_aprovacao" && (
                    <Button 
                      onClick={() => setShowCompleteDialog(true)} 
                      variant="outline" 
                      size="sm"
                      className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Concluir
                    </Button>
                  )}
                  <Button 
                    onClick={() => setShowNotificationForm(true)} 
                    variant="outline" 
                    size="sm"
                    className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    Notificar
                  </Button>
                  <Button 
                    onClick={() => setShowDeleteDialog(true)} 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Descrição</p>
                <p className="text-sm">{currentAction.description || "Sem descrição"}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Data de Início</p>
                  <p className="text-sm">{format(new Date(currentAction.startDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Data de Término</p>
                  <p className="text-sm">{format(new Date(currentAction.endDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Responsável</p>
                <p className="text-sm">{currentAction.responsibleId || "Não definido"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Solicitante</p>
                <p className="text-sm">{currentAction.requesterId || "Não definido"}</p>
              </div>
              
              {currentAction.completedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Concluído em</p>
                  <p className="text-sm">{format(new Date(currentAction.completedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <ActionNotes action={currentAction} onClose={handleNotesClose} />
          </TabsContent>
          
          <TabsContent value="notifications">
            <ActionNotification 
              action={currentAction} 
              onClose={() => setActiveTab('details')}
            />
          </TabsContent>
          
          <TabsContent value="edit">
            {activeTab === "edit" && (
              <EditActionForm 
                action={currentAction} 
                open={true}
                onOpenChange={() => setActiveTab('details')}
                onSuccess={() => {
                  const updatedAction = getActionById(currentAction.id);
                  if (updatedAction) {
                    setCurrentAction(updatedAction);
                  }
                  setActiveTab('details');
                }} 
              />
            )}
          </TabsContent>
        </Tabs>

        {showCompleteDialog && (
          <CompleteActionDialog 
            actionId={currentAction.id}
            open={showCompleteDialog}
            onOpenChange={setShowCompleteDialog}
            onSuccess={() => {
              const updatedAction = getActionById(currentAction.id);
              if (updatedAction) {
                setCurrentAction(updatedAction);
              }
            }}
          />
        )}
        
        {showDeleteDialog && (
          <DeleteActionDialog 
            actionId={currentAction.id}
            actionSubject={currentAction.subject}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onDeleted={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActionView;
