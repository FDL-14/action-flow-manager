
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import RequesterForm from '@/components/RequesterForm';
import { Badge } from '@/components/ui/badge';
import { Responsible } from '@/lib/types';

// Custom type for display requesters
type DisplayRequester = Responsible & { isSystemUser?: boolean };

const RequestersPage = () => {
  const { company, responsibles } = useCompany();
  const { users } = useAuth();
  const [showRequesterForm, setShowRequesterForm] = useState(false);

  // Filter responsibles that are of type 'requester' or have role 'Solicitante'
  const requesters = responsibles.filter(resp => 
    resp.type === 'requester' || resp.role === 'Solicitante'
  );

  // Add all system users that aren't already in the requesters list
  const displayRequesters: DisplayRequester[] = [...requesters];

  // Check if all users are already included as requesters
  const userIds = users.map(user => user.id);
  const requesterUserIds = requesters
    .filter(req => req.userId)
    .map(req => req.userId);
  
  // Add missing users as requesters
  users.forEach(user => {
    if (!requesterUserIds.includes(user.id)) {
      displayRequesters.push({
        id: `user-${user.id}`,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        department: user.department || 'Usuários',
        role: 'Usuário do Sistema',
        userId: user.id,
        type: 'requester',
        companyName: company?.name || '',
        companyId: company?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        isSystemUser: true // Flag to identify users automatically added
      });
    }
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Solicitantes</h1>
        <Button onClick={() => setShowRequesterForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Solicitante
        </Button>
      </div>

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
                      {requester.isSystemUser && (
                        <Badge className="ml-2 bg-blue-500">Auto</Badge>
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
