
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Action } from '@/lib/types';
import ActionKanban from './ActionKanban';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Kanban, Layout, MessageCircle } from 'lucide-react';

interface ActionViewKanbanProps {
  action: Action;
  open: boolean;
  onClose: () => void;
}

const ActionViewKanban: React.FC<ActionViewKanbanProps> = ({
  action,
  open,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>('kanban');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] w-full overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">{action.subject}</DialogTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="kanban" className="flex items-center gap-1">
                  <Kanban className="h-4 w-4" />
                  <span>Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-1">
                  <Layout className="h-4 w-4" />
                  <span>Detalhes</span>
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>Anotações</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>
        
        <TabsContent value="kanban" className="mt-6">
          <ActionKanban 
            action={action} 
            onAddStage={(parentId, isSequential) => {
              console.log('Add stage', { parentId, isSequential });
              // Handle adding stage here
            }}
            onEditStage={(stageId) => {
              console.log('Edit stage', stageId);
              // Handle editing stage here
            }}
            onAddTask={(stageId) => {
              console.log('Add task to stage', stageId);
              // Handle adding task here
            }}
            onEditTask={(taskId) => {
              console.log('Edit task', taskId);
              // Handle editing task here
            }}
          />
        </TabsContent>
        
        <TabsContent value="details" className="mt-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Detalhes da Ação/Tarefa</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Descrição</p>
                <p className="text-sm">{action.description || "Sem descrição"}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Responsável</p>
                  <p className="text-sm">{action.responsibleName || "Não definido"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Solicitante</p>
                  <p className="text-sm">{action.requesterName || "Não definido"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Data de Início</p>
                  <p className="text-sm">
                    {action.startDate ? new Date(action.startDate).toLocaleDateString() : "Não definida"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Data de Conclusão</p>
                  <p className="text-sm">
                    {action.endDate ? new Date(action.endDate).toLocaleDateString() : "Não definida"}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                <p className="text-sm">{action.status || "Não definido"}</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="comments" className="mt-6">
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              Esta aba exibiria as anotações da ação
            </p>
          </div>
        </TabsContent>
      </DialogContent>
    </Dialog>
  );
};

export default ActionViewKanban;
