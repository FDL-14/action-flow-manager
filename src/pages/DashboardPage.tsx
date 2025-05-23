
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ActionForm from '@/components/ActionForm';
import ActionCard from '@/components/ActionCard';
import ActionFilter from '@/components/ActionFilter';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { isValidDate } from '@/lib/date-utils';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const DashboardPage = () => {
  const { company } = useCompany();
  const { actions, getActionsByStatus, getActionsByResponsible, getActionsByClient, getActionSummary } = useActions();
  const [showActionForm, setShowActionForm] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    responsibleId: 'all',
    clientId: 'all',
  });
  
  const actionSummary = getActionSummary();

  const filteredActions = actions.filter(action => {
    if (filters.status !== 'all' && action.status !== filters.status) {
      return false;
    }
    
    if (filters.responsibleId !== 'all' && action.responsibleId !== filters.responsibleId) {
      return false;
    }
    
    if (filters.clientId !== 'all' && action.clientId !== filters.clientId) {
      return false;
    }
    
    return true;
  });

  const recentActions = actions.filter(action => {
    if (!action.createdAt) return false;
    
    try {
      const createdDate = typeof action.createdAt === 'string' 
        ? new Date(action.createdAt) 
        : action.createdAt;
        
      // Check if the date is valid
      if (!isValidDate(createdDate)) {
        console.warn("Invalid createdAt date:", action.createdAt);
        return false;
      }
      
      return createdDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } catch (error) {
      console.error("Error filtering recent actions:", error);
      return false;
    }
  });

  const handleActionDeleted = () => {
    toast("Sucesso", {
      description: "Ação/Tarefa excluída com sucesso"
    });
  };
  
  // Calculate counts for each status
  const notViewedCount = actions.filter(a => a.status === 'nao_visualizada').length;
  const notStartedCount = actions.filter(a => a.status === 'nao_iniciada').length;
  const waitingApprovalCount = actions.filter(a => a.status === 'aguardando_aprovacao').length;
  
  const pieChartData = [
    { name: 'Não Visualizadas', value: notViewedCount, color: '#94A3B8' },
    { name: 'Não Iniciadas', value: notStartedCount, color: '#3B82F6' },
    { name: 'Pendentes', value: actionSummary.pending, color: '#FBBF24' },
    { name: 'Aguard. Aprovação', value: waitingApprovalCount, color: '#8B5CF6' },
    { name: 'Concluídas', value: actionSummary.completed, color: '#10B981' },
    { name: 'Atrasadas', value: actionSummary.delayed, color: '#EF4444' },
  ];
  
  const getBarChartData = () => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i));
      return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
    });
    
    return last7Days.map(day => ({
      day,
      novas: Math.floor(Math.random() * 5),
      concluidas: Math.floor(Math.random() * 5)
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Ações/Tarefas</h1>
          <p className="text-gray-500 mt-1">Acompanhe e gerencie as ações/tarefas da sua empresa</p>
        </div>
        <Button onClick={() => setShowActionForm(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação/Tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Concluídas</p>
                <h2 className="text-3xl font-bold text-gray-800 mt-1">{actionSummary.completed}</h2>
                <p className="text-xs text-gray-500 mt-1">{actionSummary.completionRate}% do total</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Atrasadas</p>
                <h2 className="text-3xl font-bold text-gray-800 mt-1">{actionSummary.delayed}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {actionSummary.total > 0 ? Math.round((actionSummary.delayed / actionSummary.total) * 100) : 0}% do total
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <h2 className="text-3xl font-bold text-gray-800 mt-1">{actionSummary.pending}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {actionSummary.total > 0 ? Math.round((actionSummary.pending / actionSummary.total) * 100) : 0}% do total
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional status metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Aguardando Aprovação</p>
                <h2 className="text-3xl font-bold text-gray-800 mt-1">{waitingApprovalCount}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {actionSummary.total > 0 ? Math.round((waitingApprovalCount / actionSummary.total) * 100) : 0}% do total
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Não Iniciadas</p>
                <h2 className="text-3xl font-bold text-gray-800 mt-1">{notStartedCount}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {actionSummary.total > 0 ? Math.round((notStartedCount / actionSummary.total) * 100) : 0}% do total
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-gray-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Não Visualizadas</p>
                <h2 className="text-3xl font-bold text-gray-800 mt-1">{notViewedCount}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {actionSummary.total > 0 ? Math.round((notViewedCount / actionSummary.total) * 100) : 0}% do total
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Progresso geral</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ações`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Atividade recente</CardTitle>
            <CardDescription>Novas e concluídas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getBarChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="novas" name="Novas ações/tarefas" fill="#6366F1" />
                  <Bar dataKey="concluidas" name="Concluídas" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Ações/Tarefas Recentes</CardTitle>
              <ActionFilter 
                onFilterChange={setFilters}
                activeFilters={filters}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {filteredActions.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                <p className="text-lg">Nenhuma ação/tarefa encontrada com os filtros selecionados.</p>
                <p className="text-sm mt-2">Tente modificar seus filtros ou criar uma nova ação/tarefa.</p>
              </div>
            ) : (
              recentActions.map(action => (
                <ActionCard 
                  key={action.id} 
                  action={action}
                  onDelete={handleActionDeleted}
                />
              ))
            )}
            
            {filteredActions.length > 3 && (
              <div className="pt-2 border-t flex justify-center">
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/actions'}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  Ver todas as ações/tarefas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ActionForm 
        open={showActionForm}
        onOpenChange={setShowActionForm}
      />
    </div>
  );
};

export default DashboardPage;
