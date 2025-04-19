
import React, { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const WorkflowReport = () => {
  const { actions } = useActions();
  const { companies, clients, responsibles } = useCompany();
  const { users } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedResponsible, setSelectedResponsible] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filterableClients, setFilterableClients] = useState(clients);
  const [filteredActions, setFilteredActions] = useState(actions);

  useEffect(() => {
    if (selectedCompany && selectedCompany !== 'all') {
      setFilterableClients(clients.filter(client => client.companyId === selectedCompany));
    } else {
      setFilterableClients(clients);
    }
  }, [selectedCompany, clients]);

  useEffect(() => {
    let filtered = [...actions];

    if (selectedCompany && selectedCompany !== 'all') {
      filtered = filtered.filter(action => action.companyId === selectedCompany);
    }

    if (selectedClient && selectedClient !== 'all') {
      filtered = filtered.filter(action => action.clientId === selectedClient);
    }

    if (selectedResponsible && selectedResponsible !== 'all') {
      filtered = filtered.filter(action => action.responsibleId === selectedResponsible);
    }

    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(action => action.status === selectedStatus);
    }

    if (startDate) {
      filtered = filtered.filter(action => new Date(action.startDate) >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(action => new Date(action.endDate) <= endDate);
    }

    setFilteredActions(filtered);
  }, [actions, selectedCompany, selectedClient, selectedResponsible, selectedStatus, startDate, endDate]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'concluido':
        return 'Concluído';
      case 'atrasado':
        return 'Atrasado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-400 hover:bg-yellow-500 text-white';
      case 'concluido':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'atrasado':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getCompanyName = (id: string) => {
    const company = companies.find(c => c.id === id);
    return company ? company.name : 'Não especificada';
  };

  const getCompanyLogo = (id: string) => {
    const company = companies.find(c => c.id === id);
    return company?.logo || '';
  };

  const getClientName = (id?: string) => {
    if (!id) return 'Não especificado';
    const client = clients.find(c => c.id === id);
    return client ? client.name : 'Não especificado';
  };

  const getResponsibleName = (id: string) => {
    // First check in users
    const user = users.find(u => u.id === id);
    if (user) return user.name;
    
    // Then check in responsibles
    const responsible = responsibles.find(r => r.id === id);
    return responsible ? responsible.name : 'Não especificado';
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Relatório de Ações', 14, 20);

    // Add company logo if selected
    if (selectedCompany !== 'all') {
      const logo = getCompanyLogo(selectedCompany);
      if (logo) {
        try {
          doc.addImage(logo, 'JPEG', 170, 10, 25, 25);
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
        }
      }
    }
    
    // Add filter information
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
    
    const filterInfo = [
      `Empresa: ${selectedCompany === 'all' ? 'Todas' : getCompanyName(selectedCompany)}`,
      `Cliente: ${selectedClient === 'all' ? 'Todos' : getClientName(selectedClient)}`,
      `Responsável: ${selectedResponsible === 'all' ? 'Todos' : getResponsibleName(selectedResponsible)}`,
      `Status: ${selectedStatus === 'all' ? 'Todos' : getStatusLabel(selectedStatus)}`,
      `Período: ${startDate ? format(startDate, 'dd/MM/yyyy') : 'Início'} até ${endDate ? format(endDate, 'dd/MM/yyyy') : 'Fim'}`
    ];
    
    let yPos = 35;
    filterInfo.forEach(info => {
      doc.text(info, 14, yPos);
      yPos += 5;
    });
    
    // Add table
    const tableColumn = ["Empresa", "Cliente", "Assunto", "Responsável", "Status", "Data Início", "Data Fim"];
    const tableRows = filteredActions.map(action => [
      getCompanyName(action.companyId),
      getClientName(action.clientId),
      action.subject,
      getResponsibleName(action.responsibleId),
      getStatusLabel(action.status),
      format(new Date(action.startDate), 'dd/MM/yyyy'),
      format(new Date(action.endDate), 'dd/MM/yyyy')
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos + 5,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    doc.save('relatorio-acoes.pdf');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Empresa</label>
            <Select onValueChange={setSelectedCompany} value={selectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <Select onValueChange={setSelectedClient} value={selectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {filterableClients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Responsável</label>
            <Select onValueChange={setSelectedResponsible} value={selectedResponsible}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select onValueChange={setSelectedStatus} value={selectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Data Início</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Data Fim</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4 mb-6">
          <Button variant="outline" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={exportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>
      
      <div className="print:mt-0 mt-4">
        <div className="print:flex print:items-center print:justify-between hidden">
          <h1 className="text-2xl font-bold">Relatório de Ações</h1>
          <div className="text-sm text-gray-500">
            Gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        
        {selectedCompany !== 'all' && (
          <div className="print:flex print:items-center print:mb-4 hidden">
            <div className="print:text-xl font-semibold">{getCompanyName(selectedCompany)}</div>
            {getCompanyLogo(selectedCompany) && (
              <img 
                src={getCompanyLogo(selectedCompany)} 
                alt="Company Logo" 
                className="h-12 ml-4" 
              />
            )}
          </div>
        )}
        
        <Card className="mt-4 print:shadow-none print:border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>Ações ({filteredActions.length})</span>
              <div className="text-sm font-normal text-gray-500 hidden print:block">
                Filtros: 
                {selectedCompany !== 'all' && ` Empresa: ${getCompanyName(selectedCompany)}`}
                {selectedClient !== 'all' && ` | Cliente: ${getClientName(selectedClient)}`}
                {selectedResponsible !== 'all' && ` | Responsável: ${getResponsibleName(selectedResponsible)}`}
                {selectedStatus !== 'all' && ` | Status: ${getStatusLabel(selectedStatus)}`}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Empresa</th>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-left">Assunto</th>
                    <th className="px-4 py-2 text-left">Responsável</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Data Início</th>
                    <th className="px-4 py-2 text-left">Data Fim</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActions.length > 0 ? (
                    filteredActions.map(action => (
                      <tr key={action.id} className="border-b">
                        <td className="px-4 py-3">{getCompanyName(action.companyId)}</td>
                        <td className="px-4 py-3">{getClientName(action.clientId)}</td>
                        <td className="px-4 py-3">{action.subject}</td>
                        <td className="px-4 py-3">{getResponsibleName(action.responsibleId)}</td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(action.status)}>
                            {getStatusLabel(action.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{format(new Date(action.startDate), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-3">{format(new Date(action.endDate), 'dd/MM/yyyy')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                        Nenhuma ação encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowReport;
