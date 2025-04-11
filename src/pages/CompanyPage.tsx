
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Calendar, 
  Edit, 
  Image, 
  Users, 
  FileText, 
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import CompanyForm from '@/components/CompanyForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CompanyPage = () => {
  const { company, clients, responsibles } = useCompany();
  const { getActionSummary } = useActions();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  
  const summary = getActionSummary();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Configurações da Empresa</h1>
        <Button onClick={() => setShowCompanyForm(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
            <CardDescription>
              Dados básicos da empresa registrada no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {company?.logo ? (
                <div className="w-40 h-40 flex-shrink-0 flex items-center justify-center p-2 border rounded-md">
                  <img 
                    src={company.logo} 
                    alt={`${company.name} Logo`} 
                    className="max-w-full max-h-full object-contain" 
                  />
                </div>
              ) : (
                <div className="w-40 h-40 flex-shrink-0 flex items-center justify-center p-2 border rounded-md bg-gray-50">
                  <Image className="h-12 w-12 text-gray-300" />
                </div>
              )}
              
              <div className="space-y-4 flex-grow">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome da Empresa</p>
                  <div className="flex items-center mt-1">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-lg font-medium">{company?.name || 'Não configurado'}</p>
                  </div>
                </div>
                
                {company && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Cadastro</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <p>{format(company.createdAt, "'Cadastrado em' dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{responsibles.length}</p>
                      <p className="text-xs text-gray-500">Responsáveis</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{clients.length}</p>
                      <p className="text-xs text-gray-500">Clientes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Ações</CardTitle>
            <CardDescription>
              Visão geral da situação atual das ações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  <p>Total de ações</p>
                </div>
                <p className="font-semibold">{summary.total}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <p className="text-sm">Concluídas</p>
                  </div>
                  <p className="text-sm">{summary.completed}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    <p className="text-sm">Atrasadas</p>
                  </div>
                  <p className="text-sm">{summary.delayed}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                    <p className="text-sm">Pendentes</p>
                  </div>
                  <p className="text-sm">{summary.pending}</p>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm font-medium text-gray-500">Taxa de conclusão</p>
                <p className="text-2xl font-bold">{summary.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CompanyForm 
        open={showCompanyForm}
        onOpenChange={setShowCompanyForm}
      />
    </div>
  );
};

export default CompanyPage;
