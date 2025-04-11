
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ActionCard from '@/components/ActionCard';
import ActionForm from '@/components/ActionForm';
import ActionFilter from '@/components/ActionFilter';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';

const ActionsPage = () => {
  const { company } = useCompany();
  const { actions } = useActions();
  const [showActionForm, setShowActionForm] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    responsibleId: 'all',
    clientId: 'all',
  });

  const filteredActions = actions.filter(action => {
    // Filter by status
    if (filters.status !== 'all' && action.status !== filters.status) {
      return false;
    }
    
    // Filter by responsible
    if (filters.responsibleId !== 'all' && action.responsibleId !== filters.responsibleId) {
      return false;
    }
    
    // Filter by client
    if (filters.clientId !== 'all' && action.clientId !== filters.clientId) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          {company?.logo && (
            <img 
              src={company.logo} 
              alt={`${company.name} Logo`} 
              className="h-10 mr-3" 
            />
          )}
          <h1 className="text-2xl font-bold">Gerenciamento de Ações</h1>
        </div>
        <Button onClick={() => setShowActionForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Lista de Ações</h2>
          <p className="text-sm text-gray-500">
            {filteredActions.length} {filteredActions.length === 1 ? 'ação encontrada' : 'ações encontradas'}
          </p>
        </div>
        <ActionFilter 
          onFilterChange={setFilters}
          activeFilters={filters}
        />
      </div>

      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">Nenhuma ação encontrada com os filtros selecionados.</p>
            <Button variant="outline" onClick={() => setFilters({ status: 'all', responsibleId: 'all', clientId: 'all' })}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          filteredActions.map(action => (
            <ActionCard key={action.id} action={action} />
          ))
        )}
      </div>

      <ActionForm 
        open={showActionForm}
        onOpenChange={setShowActionForm}
      />
    </div>
  );
};

export default ActionsPage;
