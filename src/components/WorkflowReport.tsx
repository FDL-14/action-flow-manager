import React, { useState } from 'react';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import WorkflowReportFilter from './WorkflowReportFilter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const WorkflowReport = () => {
  const { actions } = useActions();
  const { responsibles, clients } = useCompany();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: 'all',
    responsibleId: 'all',
    clientId: 'all',
    startDate: null,
    endDate: null,
    showNotes: true,
    showAttachments: true,
  });
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

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
    
    if (filters.startDate && new Date(action.startDate) < new Date(filters.startDate)) {
      return false;
    }
    
    if (filters.endDate && new Date(action.endDate) > new Date(filters.endDate)) {
      return false;
    }
    
    return true;
  });

  const getResponsibleName = (id: string) => {
    const responsible = responsibles.find(r => r.id === id);
    return responsible ? responsible.name : 'N/A';
  };

  const getClientName = (id?: string) => {
    if (!id) return 'N/A';
    const client = clients.find(c => c.id === id);
    return client ? client.name : 'N/A';
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Relatório Gerencial de Ações', 14, 20);
      
      doc.setFontSize(10);
      let filterText = `Filtros: Status: ${filters.status === 'all' ? 'Todos' : 
        filters.status === 'pendente' ? 'Pendentes' : 
        filters.status === 'concluido' ? 'Concluídas' : 'Atrasadas'}`;
      doc.text(filterText, 14, 30);
      
      doc.text(`Data do relatório: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 35);
      
      const tableColumn = ["Assunto", "Responsável", "Cliente", "Status", "Início", "Término"];
      const tableRows = filteredActions.map(action => [
        action.subject,
        getResponsibleName(action.responsibleId),
        getClientName(action.clientId),
        action.status === 'pendente' ? 'Pendente' : 
        action.status === 'concluido' ? 'Concluída' : 'Atrasada',
        format(new Date(action.startDate), 'dd/MM/yyyy', { locale: ptBR }),
        format(new Date(action.endDate), 'dd/MM/yyyy', { locale: ptBR })
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [60, 60, 60] }
      });
      
      const pdfDoc = doc as any;
      let yPos = pdfDoc.lastAutoTable.finalY + 10;
      
      if (filters.showNotes || filters.showAttachments) {
        doc.setFontSize(12);
        doc.text('Detalhes das Ações', 14, yPos);
        yPos += 5;
        
        filteredActions.forEach(action => {
          yPos += 8;
          
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(10);
          doc.text(`Ação: ${action.subject}`, 14, yPos);
          yPos += 5;
          
          if (filters.showNotes && action.notes.length > 0) {
            const visibleNotes = action.notes.filter(note => !note.isDeleted);
            if (visibleNotes.length > 0) {
              doc.setFontSize(8);
              doc.text('Anotações:', 14, yPos);
              yPos += 4;
              
              visibleNotes.forEach(note => {
                const noteText = `- ${format(new Date(note.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}: ${note.content.substring(0, 80)}${note.content.length > 80 ? '...' : ''}`;
                
                if (yPos > 270) {
                  doc.addPage();
                  yPos = 20;
                }
                
                doc.text(noteText, 16, yPos);
                yPos += 4;
              });
            }
          }
          
          if (filters.showAttachments && action.attachments && action.attachments.length > 0) {
            yPos += 2;
            
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            
            doc.setFontSize(8);
            doc.text(`Anexos: ${action.attachments.length} arquivo(s)`, 14, yPos);
            yPos += 6;
          }
          
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          } else {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPos, 196, yPos);
            yPos += 2;
          }
        });
      }
      
      doc.save(`relatorio_acoes_${format(new Date(), 'dd_MM_yyyy_HHmm', { locale: ptBR })}.pdf`);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: "O relatório foi baixado como PDF.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const printReport = () => {
    window.print();
  };

  const handleViewAction = (actionId: string) => {
    if (expandedActionId === actionId) {
      setExpandedActionId(null);
    } else {
      setExpandedActionId(actionId);
    }
  };

  return (
    <div className="space-y-6 print:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <h2 className="text-2xl font-bold flex items-center">
          <FileText className="mr-2 h-6 w-6" />
          Relatório Gerencial
        </h2>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={generatePDF} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
          <Button onClick={printReport} variant="outline" className="flex items-center gap-1">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>
      
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <WorkflowReportFilter 
            onFilterChange={setFilters}
            activeFilters={filters}
          />
        </CardContent>
      </Card>
      
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-center">Relatório Gerencial de Ações</h1>
        <p className="text-center text-gray-500">
          {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden print:shadow-none">
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma ação encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead className="print:hidden">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.map((action) => (
                  <React.Fragment key={action.id}>
                    <TableRow>
                      <TableCell className="font-medium">{action.subject}</TableCell>
                      <TableCell>{getResponsibleName(action.responsibleId)}</TableCell>
                      <TableCell>{getClientName(action.clientId)}</TableCell>
                      <TableCell>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            action.status === 'concluido' 
                              ? 'bg-green-100 text-green-800' 
                              : action.status === 'atrasado' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {action.status === 'concluido' 
                            ? 'Concluída' 
                            : action.status === 'atrasado' 
                              ? 'Atrasada' 
                              : 'Pendente'}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(action.startDate), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{format(new Date(action.endDate), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="print:hidden">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewAction(action.id)}
                        >
                          {expandedActionId === action.id ? 'Fechar' : 'Ver'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedActionId === action.id && (filters.showNotes || filters.showAttachments) && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Card className="mb-4 mt-2">
                            <CardContent className="pt-6">
                              <h4 className="text-lg font-bold mb-2">{action.subject}</h4>
                              <p className="text-sm text-gray-500 mb-4">{action.description}</p>
                              
                              {filters.showNotes && action.notes.filter(note => !note.isDeleted).length > 0 && (
                                <div className="mb-4">
                                  <h5 className="text-sm font-semibold mb-2">Anotações:</h5>
                                  <div className="space-y-2 pl-4 text-sm">
                                    {action.notes
                                      .filter(note => !note.isDeleted)
                                      .map((note) => (
                                        <div key={note.id} className="pb-2 border-b border-gray-100">
                                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>
                                              {format(new Date(note.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </span>
                                          </div>
                                          <p className="whitespace-pre-line">{note.content}</p>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                              
                              {filters.showAttachments && action.attachments && action.attachments.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold mb-2">Anexos:</h5>
                                  <div className="pl-4">
                                    <p className="text-sm">{action.attachments.length} arquivo(s) anexado(s)</p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowReport;
