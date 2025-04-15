
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ActionCard from '@/components/ActionCard';
import ActionForm from '@/components/ActionForm';
import ActionFilter from '@/components/ActionFilter';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useIsMobile } from '@/hooks/use-mobile';

const ActionsPage = () => {
  const { company } = useCompany();
  const { actions } = useActions();
  const [showActionForm, setShowActionForm] = useState(false);
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState({
    status: 'all',
    responsibleId: 'all',
    clientId: 'all',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleActionDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const handleActionMenuClick = (actionId: string) => {
    setProcessingAction(actionId);
    // Pequeno timeout para garantir que a UI seja atualizada
    setTimeout(() => {
      setProcessingAction(null);
    }, 500);
  };

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
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Ações</h1>
        <Button onClick={() => setShowActionForm(true)} className="mt-2 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-start sm:items-center mb-4`}>
        <div>
          <h2 className="text-xl font-semibold">Lista de Ações</h2>
          <p className="text-sm text-gray-500">
            {filteredActions.length} {filteredActions.length === 1 ? 'ação encontrada' : 'ações encontradas'}
          </p>
        </div>
        <div className={isMobile ? 'mt-3 w-full' : ''}>
          <ActionFilter 
            onFilterChange={setFilters}
            activeFilters={filters}
          />
        </div>
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
            <ActionCard 
              key={`${action.id}-${refreshKey}`} 
              action={action}
              onDelete={handleActionDeleted} 
              onMenuClick={() => handleActionMenuClick(action.id)}
              isProcessing={processingAction === action.id}
            />
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
