
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import ActionForm from '@/components/ActionForm';
import ActionCard from '@/components/ActionCard';
import ActionFilter from '@/components/ActionFilter';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';

const DashboardPage = () => {
  const { company } = useCompany();
  const { actions, getActionsByStatus, getActionsByResponsible, getActionsByClient } = useActions();
  const [showActionForm, setShowActionForm] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    responsibleId: 'all',
    clientId: 'all',
  });

  const filteredActions = actions.filter(action => {
    // Filtrar por status
    if (filters.status !== 'all' && action.status !== filters.status) {
      return false;
    }
    
    // Filtrar por responsável
    if (filters.responsibleId !== 'all' && action.responsibleId !== filters.responsibleId) {
      return false;
    }
    
    // Filtrar por cliente
    if (filters.clientId !== 'all' && action.clientId !== filters.clientId) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Ações</h1>
        <Button onClick={() => setShowActionForm(true)} className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      <Dashboard />

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Ações Recentes</h2>
          <ActionFilter 
            onFilterChange={setFilters}
            activeFilters={filters}
          />
        </div>

        <div className="space-y-4">
          {filteredActions.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              Nenhuma ação encontrada com os filtros selecionados.
            </p>
          ) : (
            filteredActions.slice(0, 3).map(action => (
              <ActionCard key={action.id} action={action} />
            ))
          )}
        </div>
        
        {filteredActions.length > 3 && (
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => window.location.href = '/actions'}>
              Ver todas as ações
            </Button>
          </div>
        )}
      </div>

      <ActionForm 
        open={showActionForm}
        onOpenChange={setShowActionForm}
      />
    </div>
  );
};

export default DashboardPage;
