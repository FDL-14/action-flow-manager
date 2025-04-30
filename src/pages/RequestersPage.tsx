
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, User } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import RequesterForm from '@/components/RequesterForm';
import { Badge } from '@/components/ui/badge';
import { Responsible } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Custom type for display requesters
type DisplayRequester = Responsible & { isSystemUser?: boolean };

const RequestersPage = () => {
  const { company, responsibles } = useCompany();
  const { users } = useAuth();
  const [showRequesterForm, setShowRequesterForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'manual'>('all');
  const [displayRequesters, setDisplayRequesters] = useState<DisplayRequester[]>([]);

  useEffect(() => {
    // Filter responsibles that are of type 'requester' or have role 'Solicitante'
    const requesters = responsibles.filter(resp => 
      resp.type === 'requester' || resp.role === 'Solicitante'
    );

    // Use filtered requesters to display
    const allRequesters: DisplayRequester[] = [...requesters];

    // Filter based on active tab
    let filteredRequesters: DisplayRequester[];
    
    switch(activeTab) {
      case 'system':
        filteredRequesters = allRequesters.filter(req => req.isSystemUser || req.userId);
        break;
      case 'manual':
        filteredRequesters = allRequesters.filter(req => !req.isSystemUser && !req.userId);
        break;
      case 'all':
      default:
        filteredRequesters = allRequesters;
        break;
    }

    setDisplayRequesters(filteredRequesters);
  }, [responsibles, activeTab, users]);

  // Count stats for tabs
  const systemRequestersCount = responsibles.filter(
    resp => (resp.type === 'requester' && (resp.isSystemUser || resp.userId))
  ).length;
  
  const manualRequestersCount = responsibles.filter(
    resp => (resp.type === 'requester' && !resp.isSystemUser && !resp.userId)
  ).length;
  
  const totalRequestersCount = responsibles.filter(
    resp => resp.type === 'requester'
  ).length;

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Solicitantes</h1>
        <Button onClick={() => setShowRequesterForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Solicitante
        </Button>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'all' | 'system' | 'manual')}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <span>Todos</span>
            <Badge variant="secondary" className="ml-1">{totalRequestersCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Usuários do Sistema</span>
            <Badge variant="secondary" className="ml-1">{systemRequestersCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1">
            <span>Externos</span>
            <Badge variant="secondary" className="ml-1">{manualRequestersCount}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        <div className="rounded-md border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayRequesters.map((requester) => (
                <tr key={requester.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{requester.name}</div>
                      {(requester.isSystemUser || requester.userId) && (
                        <Badge className="ml-2 bg-blue-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Usuário</span>
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{requester.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{requester.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{requester.companyName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {requester.userId ? 'Usuário do Sistema' : 'Solicitante Externo'}
                    </div>
                  </td>
                </tr>
              ))}
              {displayRequesters.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    Nenhum solicitante cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RequesterForm 
        open={showRequesterForm}
        onOpenChange={setShowRequesterForm}
      />
    </div>
  );
};

export default RequestersPage;
