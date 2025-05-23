
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Action } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Users, Info, Tag, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useActions } from '@/contexts/ActionContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Initial data structure for stages
interface Stage {
  id: string;
  title: string;
  description?: string;
  parentId?: string;
  order: number;
  isSequential?: boolean;
  actionId: string;
  tasks: Action[];
}

interface ActionKanbanProps {
  action: Action;
  onAddStage?: (parentStageId?: string, isSequential?: boolean) => void;
  onEditStage?: (stageId: string) => void;
  onAddTask?: (stageId: string) => void;
  onEditTask?: (taskId: string) => void;
}

const ActionKanban: React.FC<ActionKanbanProps> = ({ 
  action,
  onAddStage,
  onEditStage,
  onAddTask,
  onEditTask
}) => {
  // Mock data for stages - in a real app, this would come from your API
  const [stages, setStages] = useState<Stage[]>([
    {
      id: 'stage-1',
      title: 'Planejamento',
      description: 'Fase de planejamento da ação',
      order: 1,
      actionId: action.id,
      tasks: []
    },
    {
      id: 'stage-2',
      title: 'Execução',
      description: 'Fase de execução da ação',
      order: 2,
      actionId: action.id,
      tasks: []
    },
    {
      id: 'stage-3',
      title: 'Revisão',
      description: 'Fase de revisão da ação',
      order: 3,
      actionId: action.id,
      tasks: []
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParentStage, setSelectedParentStage] = useState<string | undefined>(undefined);

  // Function to handle adding a new stage
  const handleAddStage = (parentId?: string, isSequential = true) => {
    setSelectedParentStage(parentId);
    setShowAddModal(true);
    
    // In a real app, you'd call the onAddStage prop here
    if (onAddStage) {
      onAddStage(parentId, isSequential);
    }
  };

  // Function to handle drag and drop of stages
  const onDragEnd = (result: any) => {
    const { source, destination, draggableId, type } = result;
    
    if (!destination) {
      return;
    }
    
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    
    // Handling stages reordering
    if (type === 'stage') {
      const newStages = [...stages];
      const [removed] = newStages.splice(source.index, 1);
      newStages.splice(destination.index, 0, removed);
      
      // Update order for each stage
      const updatedStages = newStages.map((stage, index) => ({
        ...stage,
        order: index + 1
      }));
      
      setStages(updatedStages);
      return;
    }
    
    // Handling tasks within stages
    const sourceStage = stages.find(stage => stage.id === source.droppableId);
    const destStage = stages.find(stage => stage.id === destination.droppableId);
    
    if (!sourceStage || !destStage) return;
    
    const newStages = [...stages];
    const sourceIndex = newStages.findIndex(s => s.id === sourceStage.id);
    const destIndex = newStages.findIndex(s => s.id === destStage.id);
    
    if (source.droppableId === destination.droppableId) {
      // Moving within the same stage
      const newTasks = [...sourceStage.tasks];
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);
      
      newStages[sourceIndex] = {
        ...sourceStage,
        tasks: newTasks
      };
    } else {
      // Moving between stages
      const sourceTasks = [...sourceStage.tasks];
      const destTasks = [...destStage.tasks];
      
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);
      
      newStages[sourceIndex] = {
        ...sourceStage,
        tasks: sourceTasks
      };
      
      newStages[destIndex] = {
        ...destStage,
        tasks: destTasks
      };
    }
    
    setStages(newStages);
    
    // In a real app, you would call your API to update the task's stage
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Etapas da Ação/Tarefa</h2>
          <Button 
            size="sm" 
            onClick={() => handleAddStage(undefined, true)}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Nova Etapa
          </Button>
        </div>
        <p className="text-gray-500 text-sm">
          Gerencie as etapas e tarefas desta ação/tarefa
        </p>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-stages" type="stage" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex overflow-x-auto pb-4 gap-4"
            >
              {stages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex flex-col min-w-[280px] max-w-[280px]"
                    >
                      <div 
                        {...provided.dragHandleProps}
                        className="bg-gray-100 p-3 rounded-t-md flex items-center justify-between"
                      >
                        <h3 className="font-medium truncate">
                          {stage.title}
                        </h3>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => onEditStage && onEditStage(stage.id)}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onAddTask && onAddTask(stage.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      <Droppable droppableId={stage.id} type="task">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`bg-gray-50 p-2 rounded-b-md flex-1 min-h-[150px] ${
                              snapshot.isDraggingOver ? 'bg-gray-100' : ''
                            }`}
                          >
                            {stage.tasks.length === 0 ? (
                              <div className="text-center py-4 text-gray-400 text-sm">
                                Sem tarefas nesta etapa
                              </div>
                            ) : (
                              stage.tasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`mb-2 cursor-pointer shadow-sm ${snapshot.isDragging ? 'shadow-md' : ''}`}
                                      onClick={() => onEditTask && onEditTask(task.id)}
                                    >
                                      <CardHeader className="p-3 pb-0">
                                        <CardTitle className="text-sm truncate">
                                          {task.subject}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-3 py-1">
                                        <CardDescription className="text-xs line-clamp-2">
                                          {task.description || "Sem descrição"}
                                        </CardDescription>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                            
                            {stage.tasks.length === 0 && (
                              <Button 
                                variant="ghost" 
                                className="w-full text-xs py-1 text-muted-foreground mt-2"
                                onClick={() => onAddTask && onAddTask(stage.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" /> 
                                Adicionar tarefa
                              </Button>
                            )}
                          </div>
                        )}
                      </Droppable>
                      
                      <div className="flex mt-2 gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs w-1/2"
                          onClick={() => handleAddStage(stage.id, true)}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Etapa sequencial
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs w-1/2"
                          onClick={() => handleAddStage(stage.id, false)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Etapa paralela
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              <div className="flex-shrink-0 w-10"></div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Example of how we'd handle adding a new stage */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedParentStage
                  ? "Adicionar sub-etapa"
                  : "Adicionar nova etapa"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Este é apenas um exemplo de interface. Em uma implementação real,
                aqui teria um formulário para adicionar uma nova etapa.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ActionKanban;
