import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useActions } from '@/contexts/ActionContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Eye,
  PlayCircle,
  UserCheck
} from 'lucide-react';
import { ActionSummary } from '@/lib/types';

const Dashboard: React.FC = () => {
  const { actions, getActionSummary } = useActions();
  const { user } = useAuth();
  const [summary, setSummary] = useState<ActionSummary>({
    completed: 0,
    delayed: 0,
    pending: 0,
    total: 0,
    completionRate: 0,
    notStarted: 0,
    notViewed: 0,
    awaitingApproval: 0
  });

  useEffect(() => {
    if (actions.length > 0) {
      const baseSummary = getActionSummary();
      
      // Calcular métricas adicionais
      const notStarted = actions.filter(action => action.status === 'nao_iniciada').length;
      const notViewed = actions.filter(action => action.status === 'nao_visualizada').length;
      const awaitingApproval = actions.filter(action => action.status === 'aguardando_aprovacao').length;
      
      setSummary({
        ...baseSummary,
        notStarted,
        notViewed,
        awaitingApproval
      });
    }
  }, [actions, getActionSummary]);

  const dashboardCards = [
    {
      title: 'Ações Concluídas',
      value: summary.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Ações finalizadas com sucesso'
    },
    {
      title: 'Ações Pendentes',
      value: summary.pending,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Ações em andamento'
    },
    {
      title: 'Ações Atrasadas',
      value: summary.delayed,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Ações que passaram do prazo'
    },
    {
      title: 'Aguardando Aprovação',
      value: summary.awaitingApproval,
      icon: UserCheck,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Ações aguardando aprovação'
    },
    {
      title: 'Não Iniciadas',
      value: summary.notStarted,
      icon: PlayCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Ações que ainda não foram iniciadas'
    },
    {
      title: 'Não Visualizadas',
      value: summary.notViewed,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Ações que ainda não foram visualizadas pelo responsável'
    }
  ];

  const getRecentActions = () => {
    return actions
      .filter(action => !action.isPersonal)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getMyPersonalReminders = () => {
    return actions
      .filter(action => action.isPersonal && (action.responsibleId === user?.id || action.createdBy === user?.id))
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Visão geral das ações/tarefas do sistema</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Taxa de conclusão */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conclusão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span>{summary.completionRate}%</span>
            </div>
            <Progress value={summary.completionRate} className="h-2" />
            <p className="text-xs text-gray-500">
              {summary.completed} de {summary.total} ações/tarefas concluídas
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Ações/Tarefas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRecentActions().map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{action.subject}</h4>
                    <p className="text-xs text-gray-500">
                      {action.companyName} {action.clientName && `• ${action.clientName}`}
                    </p>
                  </div>
                  <Badge variant={
                    action.status === 'concluido' ? 'default' :
                    action.status === 'atrasado' ? 'destructive' :
                    action.status === 'aguardando_aprovacao' ? 'secondary' :
                    'outline'
                  }>
                    {action.status}
                  </Badge>
                </div>
              ))}
              {getRecentActions().length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nenhuma ação/tarefa encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lembretes pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Lembretes Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getMyPersonalReminders().map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{reminder.subject}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(reminder.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant={
                    reminder.status === 'concluido' ? 'default' :
                    reminder.status === 'atrasado' ? 'destructive' :
                    'outline'
                  }>
                    {reminder.status}
                  </Badge>
                </div>
              ))}
              {getMyPersonalReminders().length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nenhum lembrete pessoal encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
