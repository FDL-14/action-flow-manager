
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import RequesterForm from '@/components/RequesterForm';

const RequestersPage = () => {
  const { company, responsibles } = useCompany();
  const [showRequesterForm, setShowRequesterForm] = useState(false);

  // Filter responsibles that are of type 'requester' or have role 'Solicitante'
  const requesters = responsibles.filter(resp => 
    resp.type === 'requester' || resp.role === 'Solicitante'
  );

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
          <h1 className="text-2xl font-bold">Gerenciamento de Solicitantes</h1>
        </div>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requesters.map((requester) => (
                <tr key={requester.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{requester.name}</div>
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
                </tr>
              ))}
              {requesters.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
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
