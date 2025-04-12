
import { useEffect, useState } from 'react';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, AlertTriangle, ArrowRight, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Workflow: React.FC = () => {
  const { actions } = useActions();
  const { responsibles } = useCompany();
  const [workflowItems, setWorkflowItems] = useState<Action[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'atrasado' | 'concluido'>('all');

  // Sort actions by date and group by status
  useEffect(() => {
    const sortedActions = [...actions].sort((a, b) => {
      // Sort by status priority: atrasado -> pendente -> concluido
      const statusPriority = {
        atrasado: 0,
        pendente: 1,
        concluido: 2
      };
      
      const statusDiff = statusPriority[a.status as keyof typeof statusPriority] - 
                        statusPriority[b.status as keyof typeof statusPriority];
      
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by date (most recent first for each status)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Apply filter if not 'all'
    const filteredActions = filterStatus === 'all' 
      ? sortedActions 
      : sortedActions.filter(action => action.status === filterStatus);
    
    setWorkflowItems(filteredActions);
  }, [actions, filterStatus]);

  const getResponsibleName = (id: string) => {
    const responsible = responsibles.find(r => r.id === id);
    return responsible ? responsible.name : 'Não atribuído';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'atrasado':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'concluido':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getWorkflowTimeline = () => {
    return workflowItems.map(action => (
      <div key={action.id} className="workflow-item mb-4">
        <div className="flex">
          <div className="workflow-line mr-4 relative flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              action.status === 'concluido' ? 'bg-green-100' : 
              action.status === 'atrasado' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {getStatusIcon(action.status)}
            </div>
            {/* Line connector */}
            <div className="w-0.5 bg-gray-200 flex-grow mt-1"></div>
          </div>
          
          <Card className="flex-grow mb-2">
            <CardHeader className="p-3 pb-0">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{action.subject}</CardTitle>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  action.status === 'concluido' ? 'bg-green-100 text-green-800' : 
                  action.status === 'atrasado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {action.status === 'concluido' ? 'Concluído' : 
                   action.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <div><span className="font-medium">Responsável:</span> {getResponsibleName(action.responsibleId)}</div>
                <div><span className="font-medium">Início:</span> {format(new Date(action.startDate), "dd/MM/yyyy", { locale: ptBR })}</div>
                <div><span className="font-medium">ID:</span> #{action.id}</div>
                <div><span className="font-medium">Término:</span> {format(new Date(action.endDate), "dd/MM/yyyy", { locale: ptBR })}</div>
                {action.createdByName && (
                  <div className="col-span-2 flex items-center">
                    <UserRound className="h-3 w-3 mr-1" />
                    <span className="font-medium">Criado por:</span> {action.createdByName}
                  </div>
                )}
              </div>
              
              {action.completedAt && (
                <div className="mt-1 text-xs">
                  <span className="font-medium">Concluído em:</span> {format(new Date(action.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
              
              <div className="mt-2 text-xs">
                <p className="line-clamp-2">{action.description}</p>
              </div>
              
              {action.notes && action.notes.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="font-medium text-gray-500">{action.notes.filter(n => !n.isDeleted).length} anotações</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    ));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Workflow de Ações</h2>
      
      <div className="flex mb-6 space-x-2">
        <Button 
          variant={filterStatus === 'all' ? 'default' : 'outline'} 
          onClick={() => setFilterStatus('all')}
          size="sm"
        >
          Todas
        </Button>
        <Button 
          variant={filterStatus === 'pendente' ? 'default' : 'outline'} 
          onClick={() => setFilterStatus('pendente')}
          size="sm"
          className="text-yellow-500"
        >
          <Clock className="h-4 w-4 mr-1" />
          Pendentes
        </Button>
        <Button 
          variant={filterStatus === 'atrasado' ? 'default' : 'outline'} 
          onClick={() => setFilterStatus('atrasado')}
          size="sm"
          className="text-red-500"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Atrasadas
        </Button>
        <Button 
          variant={filterStatus === 'concluido' ? 'default' : 'outline'} 
          onClick={() => setFilterStatus('concluido')}
          size="sm"
          className="text-green-500"
        >
          <Check className="h-4 w-4 mr-1" />
          Concluídas
        </Button>
      </div>
      
      <div className="workflow-container">
        {workflowItems.length > 0 ? (
          getWorkflowTimeline()
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhuma ação encontrada para o filtro selecionado
          </div>
        )}
      </div>
    </div>
  );
};

export default Workflow;
