
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Action } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Users, Info, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Action as LegacyAction } from '@/lib/types';
import { useActions } from '@/contexts/ActionContext';

// Define status columns for the Kanban board
const statusColumns = [
  { id: 'nao_visualizada', title: 'Não Visualizada', color: 'bg-gray-200' },
  { id: 'nao_iniciada', title: 'Não Iniciada', color: 'bg-blue-200' },
  { id: 'pendente', title: 'Pendente', color: 'bg-yellow-200' },
  { id: 'atrasada', title: 'Atrasada', color: 'bg-red-200' },
  { id: 'aguardando_aprovacao', title: 'Aguardando Aprovação', color: 'bg-purple-200' },
  { id: 'concluido', title: 'Concluído', color: 'bg-green-200' },
];

interface KanbanProps {
  actions: Action[];
  readOnly?: boolean;
  onActionClick?: (action: Action) => void;
  title?: string;
  description?: string;
}

const Kanban: React.FC<KanbanProps> = ({ 
  actions, 
  readOnly = true, 
  onActionClick, 
  title = "Kanban de Ações/Tarefas",
  description = "Arraste e solte as ações/tarefas para alterar seu status"
}) => {
  const { updateActionStatus } = useActions();
  
  // Group actions by status
  const getActionsByStatus = () => {
    const columns = statusColumns.reduce((acc, column) => {
      acc[column.id] = [];
      return acc;
    }, {} as Record<string, Action[]>);
    
    // Add actions to their respective columns
    actions.forEach(action => {
      const status = action.status || 'nao_iniciada';
      if (columns[status]) {
        columns[status].push(action);
      } else {
        // Default to 'nao_iniciada' if status doesn't match any column
        columns['nao_iniciada'].push(action);
      }
    });
    
    return columns;
  };

  const [columns, setColumns] = useState(getActionsByStatus());

  // Update the columns when actions prop changes
  React.useEffect(() => {
    setColumns(getActionsByStatus());
  }, [actions]);

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    
    // If dropped outside of a droppable area or in read-only mode
    if (!destination || readOnly) {
      if (readOnly) {
        toast.info("Modo visualização apenas", {
          description: "Alterações de status devem ser feitas na tela de detalhes."
        });
      }
      return;
    }
    
    // If dropped in the same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    
    // Find the action being dragged
    const actionId = draggableId;
    const action = actions.find(a => a.id === actionId);
    
    if (!action) return;
    
    // Create a new columns object
    const newColumns = {...columns};
    
    // Remove from source column
    newColumns[source.droppableId] = newColumns[source.droppableId].filter(
      a => a.id !== actionId
    );
    
    // Add to destination column
    const newStatus = destination.droppableId;

    try {
      // Update action status in backend
      await updateActionStatus(actionId, newStatus as any);
      
      // Update local state
      if (action) {
        const updatedAction = {...action, status: newStatus as any};
        newColumns[newStatus] = [...newColumns[newStatus], updatedAction];
        setColumns(newColumns);
      }
    } catch (error) {
      console.error('Error updating action status:', error);
      toast.error("Erro ao atualizar status", {
        description: "Ocorreu um erro ao atualizar o status da ação/tarefa."
      });
    }
  };

  const getStatusColor = (status: string) => {
    const column = statusColumns.find(col => col.id === status);
    return column?.color || 'bg-gray-200';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-gray-500">{description}</p>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
          {statusColumns.map(column => (
            <div key={column.id} className="flex flex-col min-w-[250px]">
              <h3 className={`p-2 text-sm font-medium ${column.color} rounded-t-md`}>
                {column.title} ({columns[column.id]?.length || 0})
              </h3>
              
              <Droppable droppableId={column.id} isDropDisabled={readOnly}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-gray-50 rounded-b-md flex-1 min-h-[200px] p-2 ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : ''
                    }`}
                  >
                    {columns[column.id]?.map((action, index) => (
                      <Draggable 
                        key={action.id} 
                        draggableId={action.id} 
                        index={index}
                        isDragDisabled={readOnly}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 cursor-pointer shadow-sm border-l-4 ${
                              getStatusColor(action.status || 'nao_iniciada')
                            } ${snapshot.isDragging ? 'shadow-md' : ''}`}
                            onClick={() => onActionClick && onActionClick(action)}
                          >
                            <CardHeader className="p-3 pb-1">
                              <div className="flex justify-between">
                                <CardTitle className="text-sm truncate">
                                  {action.subject}
                                </CardTitle>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="p-3 pt-0 pb-1">
                              <CardDescription className="text-xs line-clamp-2">
                                {action.description || "Sem descrição"}
                              </CardDescription>
                            </CardContent>
                            
                            <CardFooter className="flex justify-between p-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(action.endDate), "dd/MM", { locale: ptBR })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">
                                  {action.responsibleName || "Sem responsável"}
                                </span>
                              </div>
                            </CardFooter>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Kanban;
