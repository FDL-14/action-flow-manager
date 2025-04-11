
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  User, 
  Mail, 
  Briefcase, 
  Plus,
  CheckCircle2, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import ResponsibleForm from '@/components/ResponsibleForm';
import { Badge } from '@/components/ui/badge';

const ResponsiblesPage = () => {
  const { company, responsibles } = useCompany();
  const { getActionsByResponsible } = useActions();
  const [showResponsibleForm, setShowResponsibleForm] = useState(false);

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
          <h1 className="text-2xl font-bold">Gerenciamento de Responsáveis</h1>
        </div>
        <Button onClick={() => setShowResponsibleForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Responsável
        </Button>
      </div>

      {responsibles.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum responsável cadastrado</CardTitle>
            <CardDescription>
              Clique no botão "Cadastrar Responsável" para adicionar seu primeiro responsável.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Responsáveis</CardTitle>
            <CardDescription>
              Gerenciar responsáveis para atribuição de ações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responsibles.map((responsible) => {
                  const responsibleActions = getActionsByResponsible(responsible.id);
                  const completed = responsibleActions.filter(a => a.status === 'concluido').length;
                  const delayed = responsibleActions.filter(a => a.status === 'atrasado').length;
                  const pending = responsibleActions.filter(a => a.status === 'pendente').length;
                  
                  return (
                    <TableRow key={responsible.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {responsible.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {responsible.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                          {responsible.department} - {responsible.role}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {completed > 0 && (
                            <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> {completed}
                            </Badge>
                          )}
                          {delayed > 0 && (
                            <Badge className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {delayed}
                            </Badge>
                          )}
                          {pending > 0 && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {pending}
                            </Badge>
                          )}
                          {responsibleActions.length === 0 && (
                            <span className="text-sm text-gray-500">Nenhuma ação</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ResponsibleForm 
        open={showResponsibleForm}
        onOpenChange={setShowResponsibleForm}
      />
    </div>
  );
};

export default ResponsiblesPage;
