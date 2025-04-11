
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Check, Filter } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface ActionFilterProps {
  onFilterChange: (filter: {
    status: string;
    responsibleId: string;
    clientId: string;
  }) => void;
  activeFilters: {
    status: string;
    responsibleId: string;
    clientId: string;
  };
}

const ActionFilter: React.FC<ActionFilterProps> = ({
  onFilterChange,
  activeFilters,
}) => {
  const { responsibles, clients } = useCompany();
  const [filter, setFilter] = useState(activeFilters);

  useEffect(() => {
    onFilterChange(filter);
  }, [filter, onFilterChange]);

  const updateFilter = (key: keyof typeof filter, value: string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilter({
      status: 'all',
      responsibleId: 'all',
      clientId: 'all',
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="border-dashed h-8">
            <Filter className="mr-2 h-4 w-4" />
            <span>Todas as ações</span>
            {(filter.status !== 'all' || filter.responsibleId !== 'all' || filter.clientId !== 'all') && (
              <span className="ml-1 rounded-full bg-primary w-2 h-2" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Status</span>
              {filter.status !== 'all' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={filter.status}
                onValueChange={(value) => updateFilter('status', value)}
              >
                <DropdownMenuRadioItem value="all">
                  Todas as ações
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="concluido">
                  Concluídas
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pendente">
                  Pendentes
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="atrasado">
                  Atrasadas
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Responsáveis</span>
              {filter.responsibleId !== 'all' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={filter.responsibleId}
                onValueChange={(value) => updateFilter('responsibleId', value)}
              >
                <DropdownMenuRadioItem value="all">
                  Todos os responsáveis
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                {responsibles.map((responsible) => (
                  <DropdownMenuRadioItem key={responsible.id} value={responsible.id}>
                    {responsible.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Clientes</span>
              {filter.clientId !== 'all' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={filter.clientId}
                onValueChange={(value) => updateFilter('clientId', value)}
              >
                <DropdownMenuRadioItem value="all">
                  Todos os clientes
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                {clients.map((client) => (
                  <DropdownMenuRadioItem key={client.id} value={client.id}>
                    {client.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={clearFilters}>
            Limpar filtros
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ActionFilter;
