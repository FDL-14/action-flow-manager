
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreVertical, GitBranch, Layers } from 'lucide-react';
import { Action, ActionStage } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import StageForm from './StageForm';
import TaskForm from './TaskForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActionKanbanProps {
  action: Action;
  onAddStage: (parentId?: string, isSequential?: boolean) => void;
  onEditStage: (stageId: string) => void;
  onAddTask: (stageId: string) => void;
  onEditTask: (taskId: string) => void;
}

const ActionKanban: React.FC<ActionKanbanProps> = ({
  action,
  onAddStage,
  onEditStage,
  onAddTask,
  onEditTask
}) => {
  const [stages, setStages] = useState<ActionStage[]>([]);
  const [tasks, setTasks] = useState<Action[]>([]);
  const [showStageForm, setShowStageForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ActionStage | null>(null);
  const [selectedParentStage, setSelectedParentStage] = useState<string | null>(null);

  useEffect(() => {
    loadStagesAndTasks();
  }, [action.id]);

  const loadStagesAndTasks = async () => {
    try {
      // Carregar estágios
      const { data: stagesData, error: stagesError } = await supabase
        .from('action_stages')
        .select('*')
        .eq('action_id', action.id)
        .order('order_index');

      if (stagesError) {
        console.error('Erro ao carregar estágios:', stagesError);
        return;
      }

      // Carregar subtarefas
      const { data: tasksData, error: tasksError } = await supabase
        .from('actions')
        .select('*')
        .eq('parent_action_id', action.id)
        .order('order_index');

      if (tasksError) {
        console.error('Erro ao carregar subtarefas:', tasksError);
        return;
      }

      const formattedStages: ActionStage[] = (stagesData || []).map(stage => ({
        id: stage.id,
        actionId: stage.action_id,
        title: stage.title,
        description: stage.description,
        order: stage.order_index,
        parentStageId: stage.parent_stage_id,
        isSequential: stage.is_sequential,
        createdAt: new Date(stage.created_at),
        updatedAt: new Date(stage.updated_at),
        createdBy: stage.created_by
      }));

      const formattedTasks: Action[] = (tasksData || []).map(task => ({
        id: task.id,
        subject: task.title,
        description: task.description || '',
        status: task.status as any,
        responsibleId: task.responsible_id || '',
        startDate: new Date(task.created_at),
        endDate: task.due_date ? new Date(task.due_date) : new Date(),
        companyId: task.company_id || '',
        clientId: task.client_id,
        requesterId: task.requester_id,
        notes: [],
        createdAt: new Date(task.created_at),
        updatedAt: new Date(task.updated_at),
        parentActionId: task.parent_action_id,
        isSubtask: task.is_subtask,
        order: task.order_index,
        stageId: task.stage_id
      }));

      setStages(formattedStages);
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleAddStage = (parentId?: string, isSequential: boolean = true) => {
    setSelectedParentStage(parentId || null);
    setSelectedStage(null);
    setShowStageForm(true);
  };

  const handleEditStage = (stage: ActionStage) => {
    setSelectedStage(stage);
    setShowStageForm(true);
  };

  const handleAddTask = (stageId: string) => {
    setSelectedParentStage(stageId);
    setShowTaskForm(true);
  };

  const renderStageTree = (parentStageId?: string, level: number = 0) => {
    const childStages = stages.filter(stage => stage.parentStageId === parentStageId);
    
    return childStages.map((stage, index) => (
      <div key={stage.id} className={`ml-${level * 4}`}>
        <Card className="mb-4 border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {level > 0 && <GitBranch className="h-4 w-4 text-gray-400" />}
                <CardTitle className="text-sm font-medium">{stage.title}</CardTitle>
                <Badge variant={stage.isSequential ? "default" : "secondary"}>
                  {stage.isSequential ? "Sequencial" : "Paralelo"}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleEditStage(stage)}>
                    Editar Etapa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddStage(stage.id, true)}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Adicionar Sub-etapa Sequencial
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddStage(stage.id, false)}>
                    <Layers className="h-4 w-4 mr-2" />
                    Adicionar Sub-etapa Paralela
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddTask(stage.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Tarefa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {stage.description && (
              <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
            )}
          </CardHeader>
          
          <CardContent>
            {/* Renderizar tarefas deste estágio */}
            <div className="space-y-2 mb-4">
              {tasks
                .filter(task => task.stageId === stage.id)
                .map((task) => (
                  <Card key={task.id} className="bg-gray-50">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium">{task.subject}</h4>
                          <p className="text-xs text-gray-500">{task.description}</p>
                        </div>
                        <Badge variant={
                          task.status === 'concluido' ? 'default' :
                          task.status === 'atrasado' ? 'destructive' :
                          task.status === 'aguardando_aprovacao' ? 'secondary' :
                          'outline'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Renderizar sub-etapas recursivamente */}
            {renderStageTree(stage.id, level + 1)}
          </CardContent>
        </Card>
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Etapas e Tarefas</h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleAddStage(undefined, true)} 
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Etapa
          </Button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {stages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma etapa criada ainda.</p>
            <p className="text-sm">Clique em "Nova Etapa" para começar.</p>
          </div>
        ) : (
          renderStageTree()
        )}
      </div>

      <StageForm
        open={showStageForm}
        onOpenChange={setShowStageForm}
        actionId={action.id}
        parentStageId={selectedParentStage}
        stage={selectedStage}
        onSaved={loadStagesAndTasks}
      />

      <TaskForm
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        parentActionId={action.id}
        stageId={selectedParentStage}
        onSaved={loadStagesAndTasks}
      />
    </div>
  );
};

export default ActionKanban;
