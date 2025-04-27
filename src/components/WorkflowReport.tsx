import React, { useState } from 'react';
import { useActions } from '@/contexts/ActionContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Action, Client, Responsible } from '@/lib/types';
import { useCompany } from '@/contexts/CompanyContext';
import { 
  Download, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  FileText as FileIcon, 
  ImageIcon, 
  FileText, 
  File 
} from 'lucide-react';
import WorkflowReportFilter from './WorkflowReportFilter';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

interface WorkflowReportProps {
  onClose?: () => void;
}

const WorkflowReport: React.FC<WorkflowReportProps> = ({ onClose }) => {
  const { actions } = useActions();
  const { clients, companies, responsibles } = useCompany();
  const [filter, setFilter] = useState({
    companyId: 'all',
    clientId: 'all',
    responsibleId: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: 'all',
    showNotes: true,
    showAttachments: true
  });

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getClientNameById = (clientId: string | undefined): string => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getCompanyNameById = (companyId: string): string => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Empresa não encontrada';
  };

  const getResponsibleNameById = (responsibleId: string): string => {
    const responsible = responsibles.find(r => r.id === responsibleId);
    return responsible ? responsible.name : 'Responsável não encontrado';
  };

  const filteredActions = actions.filter(action => {
    if (filter.companyId !== 'all' && action.companyId !== filter.companyId) {
      return false;
    }
    if (filter.clientId !== 'all' && action.clientId !== filter.clientId) {
      return false;
    }
    if (filter.responsibleId !== 'all' && action.responsibleId !== filter.responsibleId) {
      return false;
    }
    if (filter.startDate && action.endDate < filter.startDate) {
      return false;
    }
    if (filter.endDate && action.endDate > filter.endDate) {
      return false;
    }
    if (filter.status !== 'all' && action.status !== filter.status) {
      return false;
    }
    return true;
  });

  const generatePDF = () => {
    const doc = new jsPDF();

    const columns = [
      { header: 'Assunto', dataKey: 'subject' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Empresa', dataKey: 'company' },
      { header: 'Cliente', dataKey: 'client' },
      { header: 'Responsável', dataKey: 'responsible' },
      { header: 'Início', dataKey: 'startDate' },
      { header: 'Fim', dataKey: 'endDate' },
    ];

    const rows = filteredActions.map(action => ({
      subject: action.subject,
      status: action.status,
      company: getCompanyNameById(action.companyId),
      client: getClientNameById(action.clientId),
      responsible: getResponsibleNameById(action.responsibleId),
      startDate: formatDate(action.startDate),
      endDate: formatDate(action.endDate),
    }));

    doc.text("Relatório de Workflow", 14, 16);

    let filterText = "Filtros: ";
    if (filter.companyId !== 'all') filterText += `Empresa: ${getCompanyNameById(filter.companyId)}, `;
    if (filter.clientId !== 'all') filterText += `Cliente: ${getClientNameById(filter.clientId)}, `;
    if (filter.responsibleId !== 'all') filterText += `Responsável: ${getResponsibleNameById(filter.responsibleId)}, `;
    if (filter.startDate) filterText += `Início: ${formatDate(filter.startDate)}, `;
    if (filter.endDate) filterText += `Fim: ${formatDate(filter.endDate)}, `;
    if (filter.status !== 'all') filterText += `Status: ${filter.status}`;
    doc.setFontSize(10);
    doc.text(filterText, 14, 22);

    (doc as any).autoTable({
      columns: columns,
      body: rows,
      startY: 30,
    });

    doc.save("relatorio_workflow.pdf");
    toast.success("PDF gerado com sucesso!");
  };

  const downloadAttachment = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobURL = URL.createObjectURL(blob);
  
      const a = document.createElement('a');
      a.href = blobURL;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  
      URL.revokeObjectURL(blobURL);
      toast.success(`Arquivo "${filename}" baixado com sucesso!`);
    } catch (error) {
      console.error('Erro ao baixar o arquivo:', error);
      toast.error('Erro ao baixar o arquivo. Por favor, tente novamente.');
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="grid gap-4">
        <h2 className="text-lg font-semibold">Relatório de Workflow</h2>
        <WorkflowReportFilter filter={filter} setFilter={setFilter} />
        <Separator />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assunto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Início
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActions.map(action => (
                <tr key={action.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {action.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge>{action.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCompanyNameById(action.companyId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getClientNameById(action.clientId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getResponsibleNameById(action.responsibleId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(action.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(action.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {action.attachments && action.attachments.length > 0 && (
                      <div className="flex space-x-2">
                        {action.attachments.map((attachment, index) => {
                          const filename = attachment.substring(attachment.lastIndexOf('/') + 1);
                          const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
                          let icon = <File />;
                      
                          if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                            icon = <ImageIcon />;
                          } else if (['pdf'].includes(fileExtension)) {
                            icon = <FileIcon />;
                          } else if (['txt', 'doc', 'docx'].includes(fileExtension)) {
                            icon = <FileText />;
                          }
                      
                          return (
                            <Button
                              key={index}
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadAttachment(attachment, filename)}
                              className="p-1"
                            >
                              {icon}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Separator />
        <div className="flex justify-between">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
          <Button onClick={generatePDF}>
            <Download className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowReport;
