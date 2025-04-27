
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
import { CalendarIcon, Download, Printer, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent } from './ui/dialog';
import { Action } from '@/lib/types';

const WorkflowReport = () => {
  const { actions } = useActions();
  const { companies, clients, responsibles } = useCompany();
  const { users } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedResponsible, setSelectedResponsible] = useState<string>('all');
  const [selectedRequester, setSelectedRequester] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filterableClients, setFilterableClients] = useState(clients);
  const [filteredActions, setFilteredActions] = useState(actions);
  const [viewingAction, setViewingAction] = useState<Action | null>(null);

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

    // Add filter by requester
    if (selectedRequester && selectedRequester !== 'all') {
      filtered = filtered.filter(action => action.requesterId === selectedRequester);
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
  }, [actions, selectedCompany, selectedClient, selectedResponsible, selectedRequester, selectedStatus, startDate, endDate]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'concluido':
        return 'Concluído';
      case 'atrasado':
        return 'Atrasado';
      case 'aguardando_aprovacao':
        return 'Aguardando Aprovação';
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
      case 'aguardando_aprovacao':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
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

  const getRequesterName = (id?: string) => {
    if (!id) return 'Não especificado';
    // First check in users
    const user = users.find(u => u.id === id);
    if (user) return user.name;
    
    // Then check in responsibles (as requesters are also stored there)
    const requester = responsibles.find(r => r.id === id);
    return requester ? requester.name : 'Não especificado';
  };

  const viewActionDetails = (action: Action) => {
    setViewingAction(action);
  };

  const closeActionDetails = () => {
    setViewingAction(null);
  };

  const generateActionPDF = (action: Action) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Relatório Detalhado de Ação: ${action.subject}`, 14, 20);

    // Add company logo if available
    const logo = getCompanyLogo(action.companyId);
    if (logo) {
      try {
        doc.addImage(logo, 'JPEG', 170, 10, 25, 25);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    // Add action details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhes da Ação:", 14, 35);
    doc.setFont("helvetica", "normal");
    
    const details = [
      `ID: ${action.id}`,
      `Assunto: ${action.subject}`,
      `Descrição: ${action.description}`,
      `Status: ${getStatusLabel(action.status)}`,
      `Empresa: ${getCompanyName(action.companyId)}`,
      `Cliente: ${getClientName(action.clientId)}`,
      `Responsável: ${getResponsibleName(action.responsibleId)}`,
      `Solicitante: ${action.requesterId ? getRequesterName(action.requesterId) : 'Não especificado'}`,
      `Data de Criação: ${format(new Date(action.createdAt), 'dd/MM/yyyy HH:mm')}`,
      `Data de Início: ${format(new Date(action.startDate), 'dd/MM/yyyy')}`,
      `Data de Término: ${format(new Date(action.endDate), 'dd/MM/yyyy')}`,
      `Criado por: ${action.createdByName || 'Não especificado'}`
    ];
    
    let yPos = 42;
    details.forEach(detail => {
      doc.text(detail, 14, yPos);
      yPos += 7;
    });
    
    // Add notes section
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Histórico e Anotações:", 14, yPos);
    doc.setFont("helvetica", "normal");
    
    yPos += 7;
    
    if (action.notes && action.notes.length > 0) {
      action.notes
        .filter(note => !note.isDeleted)
        .forEach(note => {
          const date = format(new Date(note.createdAt), 'dd/MM/yyyy HH:mm');
          doc.setFont("helvetica", "bold");
          doc.text(`${date}:`, 14, yPos);
          yPos += 7;
          
          doc.setFont("helvetica", "normal");
          const textLines = doc.splitTextToSize(note.content, 180);
          textLines.forEach((line: string) => {
            doc.text(line, 20, yPos);
            yPos += 5;
          });
          
          yPos += 5;
        });
    } else {
      doc.text("Nenhuma anotação registrada.", 14, yPos);
    }
    
    // Add attachments section if any
    if (action.attachments && action.attachments.length > 0) {
      yPos += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Anexos:", 14, yPos);
      doc.setFont("helvetica", "normal");
      
      yPos += 7;
      action.attachments.forEach((attachment, index) => {
        doc.text(`${index + 1}. ${attachment.split('/').pop() || attachment}`, 14, yPos);
        yPos += 7;
      });
    }
    
    doc.save(`acao-${action.id.substring(0, 6)}.pdf`);
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
      `Solicitante: ${selectedRequester === 'all' ? 'Todos' : getRequesterName(selectedRequester)}`,
      `Status: ${selectedStatus === 'all' ? 'Todos' : getStatusLabel(selectedStatus)}`,
      `Período: ${startDate ? format(startDate, 'dd/MM/yyyy') : 'Início'} até ${endDate ? format(endDate, 'dd/MM/yyyy') : 'Fim'}`
    ];
    
    let yPos = 35;
    filterInfo.forEach(info => {
      doc.text(info, 14, yPos);
      yPos += 5;
    });
    
    // Add table
    const tableColumn = ["Empresa", "Cliente", "Assunto", "Responsável", "Solicitante", "Status", "Data Início", "Data Fim"];
    const tableRows = filteredActions.map(action => [
      getCompanyName(action.companyId),
      getClientName(action.clientId),
      action.subject,
      getResponsibleName(action.responsibleId),
      getRequesterName(action.requesterId),
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
                {responsibles.map(responsible => (
                  <SelectItem key={responsible.id} value={responsible.id}>{responsible.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Solicitante</label>
            <Select onValueChange={setSelectedRequester} value={selectedRequester}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os solicitantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os solicitantes</SelectItem>
                {responsibles.filter(r => r.type === 'requester' || !r.type).map(requester => (
                  <SelectItem key={requester.id} value={requester.id}>{requester.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
                <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
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
                {selectedRequester !== 'all' && ` | Solicitante: ${getRequesterName(selectedRequester)}`}
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
                    <th className="px-4 py-2 text-left">Solicitante</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Data Início</th>
                    <th className="px-4 py-2 text-left">Data Fim</th>
                    <th className="px-4 py-2 text-left print:hidden">Ações</th>
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
                        <td className="px-4 py-3">{action.requesterId ? getRequesterName(action.requesterId) : 'Não especificado'}</td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(action.status)}>
                            {getStatusLabel(action.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{format(new Date(action.startDate), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-3">{format(new Date(action.endDate), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-3 print:hidden">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2 flex items-center"
                              onClick={() => viewActionDetails(action)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">Detalhes</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2 flex items-center"
                              onClick={() => generateActionPDF(action)}
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">PDF</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-3 text-center text-gray-500">
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

      {/* Action Details Dialog */}
      {viewingAction && (
        <Dialog open={!!viewingAction} onOpenChange={closeActionDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{viewingAction.subject}</h2>
                  <div className="flex items-center mt-2">
                    <Badge className={getStatusColor(viewingAction.status)}>
                      {getStatusLabel(viewingAction.status)}
                    </Badge>
                    <span className="text-sm text-gray-500 ml-4">
                      ID: {viewingAction.id.substring(0, 8)}
                    </span>
                  </div>
                </div>
                
                <Button onClick={() => generateActionPDF(viewingAction)} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Informações da Ação</h3>
                  <dl className="grid grid-cols-1 gap-y-2">
                    <div className="grid grid-cols-3">
                      <dt className="font-medium">Empresa:</dt>
                      <dd className="col-span-2">{getCompanyName(viewingAction.companyId)}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="font-medium">Cliente:</dt>
                      <dd className="col-span-2">{getClientName(viewingAction.clientId)}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="font-medium">Responsável:</dt>
                      <dd className="col-span-2">{getResponsibleName(viewingAction.responsibleId)}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="font-medium">Solicitante:</dt>
                      <dd className="col-span-2">
                        {viewingAction.requesterId ? getRequesterName(viewingAction.requesterId) : 'Não especificado'}
                      </dd>
                    </div>
                    {viewingAction.createdByName && (
                      <div className="grid grid-cols-3">
                        <dt className="font-medium">Criado por:</dt>
                        <dd className="col-span-2">{viewingAction.createdByName}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Datas</h3>
                  <dl className="grid grid-cols-1 gap-y-2">
                    <div className="grid grid-cols-3">
                      <dt className="font-medium">Data de Criação:</dt>
                      <dd className="col-span-2">
                        {format(new Date(viewingAction.createdAt), 'dd/MM/yyyy HH:mm')}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="font-medium">Data de Início:</dt>
                      <dd className="col-span-2">
                        {format(new Date(viewingAction.startDate), 'dd/MM/yyyy')}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="font-medium">Data de Término:</dt>
                      <dd className="col-span-2">
                        {format(new Date(viewingAction.endDate), 'dd/MM/yyyy')}
                      </dd>
                    </div>
                    {viewingAction.completedAt && (
                      <div className="grid grid-cols-3">
                        <dt className="font-medium">Concluída em:</dt>
                        <dd className="col-span-2">
                          {format(new Date(viewingAction.completedAt), 'dd/MM/yyyy HH:mm')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Descrição</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="whitespace-pre-wrap">{viewingAction.description}</p>
                </div>
              </div>
              
              {viewingAction.completionNotes && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Justificativa de Conclusão</h3>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="whitespace-pre-wrap">{viewingAction.completionNotes}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Histórico e Anotações</h3>
                {viewingAction.notes && viewingAction.notes.filter(note => !note.isDeleted).length > 0 ? (
                  <div className="space-y-3">
                    {viewingAction.notes
                      .filter(note => !note.isDeleted)
                      .map(note => (
                        <div key={note.id} className="bg-gray-50 p-4 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-sm">
                              {format(new Date(note.createdAt), 'dd/MM/yyyy HH:mm')}
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap">{note.content}</p>
                          
                          {note.attachments && note.attachments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Anexos:</p>
                              <div className="flex flex-wrap gap-2">
                                {note.attachments.map((url, idx) => (
                                  <a 
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer" 
                                    className="text-sm text-blue-600 hover:underline flex items-center"
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Anexo {idx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Sem anotações registradas</p>
                )}
              </div>
              
              {viewingAction.attachments && viewingAction.attachments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Anexos da Ação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {viewingAction.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
                      >
                        <div className="mr-3">
                          {url.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                            <FileImage className="h-6 w-6 text-blue-500" />
                          ) : url.toLowerCase().match(/\.(pdf)$/) ? (
                            <FileText className="h-6 w-6 text-red-500" />
                          ) : (
                            <FileText className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {url.split('/').pop() || `Anexo ${idx + 1}`}
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-gray-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WorkflowReport;
