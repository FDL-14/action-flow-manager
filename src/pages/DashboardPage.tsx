
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

  // Handle action deletion - simple implementation
  const handleActionDeleted = () => {
    // This function will be called after an action is deleted
    // No need for further logic as the actions context is already updated
    toast.success("Ação excluída com sucesso");
  };
  
  // Data for pie chart
  const pieChartData = [
    { name: 'Pendentes', value: actionSummary.pending, color: '#FBBF24' },
    { name: 'Concluídas', value: actionSummary.completed, color: '#10B981' },
    { name: 'Atrasadas', value: actionSummary.delayed, color: '#EF4444' },
  ];
  
  // Data for bar chart - last 7 days activity
  const getBarChartData = () => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i));
      return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
    });
    
    // Sample data - in a real app, you'd count actions per day
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
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Ações</h1>
          <p className="text-gray-500 mt-1">Acompanhe e gerencie as ações da sua empresa</p>
        </div>
        <Button onClick={() => setShowActionForm(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Charts */}
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
                  <Bar dataKey="novas" name="Novas ações" fill="#6366F1" />
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
              <CardTitle className="text-lg font-bold">Ações Recentes</CardTitle>
              <ActionFilter 
                onFilterChange={setFilters}
                activeFilters={filters}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {filteredActions.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                <p className="text-lg">Nenhuma ação encontrada com os filtros selecionados.</p>
                <p className="text-sm mt-2">Tente modificar seus filtros ou criar uma nova ação.</p>
              </div>
            ) : (
              filteredActions.slice(0, 3).map(action => (
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
                  Ver todas as ações
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
