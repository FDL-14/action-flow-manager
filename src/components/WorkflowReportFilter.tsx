import React, { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, X } from 'lucide-react';

interface WorkflowReportFilterProps {
  filter: {
    status: string;
    responsibleId: string;
    clientId: string;
    startDate: Date | null;
    endDate: Date | null;
    showNotes: boolean;
    showAttachments: boolean;
  };
  setFilter: (filters: {
    status: string;
    responsibleId: string;
    clientId: string;
    startDate: Date | null;
    endDate: Date | null;
    showNotes: boolean;
    showAttachments: boolean;
  }) => void;
}

const WorkflowReportFilter: React.FC<WorkflowReportFilterProps> = ({
  filter,
  setFilter,
}) => {
  const { responsibles, clients } = useCompany();

  const updateFilter = (key: keyof typeof filter, value: any) => {
    setFilter({ ...filter, [key]: value });
  };

  const clearFilters = () => {
    setFilter({
      status: 'all',
      responsibleId: 'all',
      clientId: 'all',
      startDate: null,
      endDate: null,
      showNotes: true,
      showAttachments: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          Filtros do Relatório
        </h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
          <X className="h-4 w-4" />
          Limpar Filtros
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filter.status}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="concluido">Concluídas</SelectItem>
              <SelectItem value="atrasado">Atrasadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Responsible Filter */}
        <div className="space-y-2">
          <Label htmlFor="responsible-filter">Responsável</Label>
          <Select
            value={filter.responsibleId}
            onValueChange={(value) => updateFilter('responsibleId', value)}
          >
            <SelectTrigger id="responsible-filter">
              <SelectValue placeholder="Todos os responsáveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {responsibles.map((responsible) => (
                <SelectItem key={responsible.id} value={responsible.id}>
                  {responsible.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Client Filter */}
        <div className="space-y-2">
          <Label htmlFor="client-filter">Cliente</Label>
          <Select
            value={filter.clientId}
            onValueChange={(value) => updateFilter('clientId', value)}
          >
            <SelectTrigger id="client-filter">
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filter.startDate ? (
                  format(filter.startDate, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione a data inicial</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filter.startDate || undefined}
                onSelect={(date) => updateFilter('startDate', date)}
                initialFocus
                locale={ptBR}
              />
              {filter.startDate && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => updateFilter('startDate', null)}
                  >
                    Limpar data
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        
        {/* End Date Filter */}
        <div className="space-y-2">
          <Label>Data de Término</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filter.endDate ? (
                  format(filter.endDate, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione a data final</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filter.endDate || undefined}
                onSelect={(date) => updateFilter('endDate', date)}
                initialFocus
                locale={ptBR}
              />
              {filter.endDate && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => updateFilter('endDate', null)}
                  >
                    Limpar data
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Report Detail Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-notes" className="cursor-pointer">
              Incluir anotações
            </Label>
            <Switch
              id="show-notes"
              checked={filter.showNotes}
              onCheckedChange={(checked) => updateFilter('showNotes', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-attachments" className="cursor-pointer">
              Incluir informações de anexos
            </Label>
            <Switch
              id="show-attachments"
              checked={filter.showAttachments}
              onCheckedChange={(checked) => updateFilter('showAttachments', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowReportFilter;
