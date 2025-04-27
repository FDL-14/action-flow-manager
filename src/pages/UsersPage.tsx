
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import UserForm from '@/components/UserForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { User } from '@/lib/types';

const UsersPage = () => {
  const { companies } = useCompany();
  const { users, resetUserPassword, user } = useAuth(); // Now resetUserPassword is properly defined
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleChangePassword = (userId: string) => {
    setSelectedUserId(userId);
    setShowPasswordForm(true);
  };

  const handleCloseForm = () => {
    setShowUserForm(false);
    setEditingUser(undefined);
  };

  const handleClosePasswordForm = () => {
    setShowPasswordForm(false);
    setSelectedUserId('');
  };

  // Fixed function to properly display company names without repetition
  const getCompanyNames = (companyIds: string[]) => {
    if (!companyIds || companyIds.length === 0) return 'Nenhuma empresa associada';
    
    const companyNames = companyIds.map(companyId => {
      const company = companies.find(c => c.id === companyId);
      return company ? company.name : 'Não encontrada';
    });
    
    // Remove duplicates from the names array
    const uniqueCompanyNames = [...new Set(companyNames)];
    return uniqueCompanyNames.join(', ');
  };

  // Only show edit buttons for users the current user has permission to edit
  const canEditUsers = user?.permissions[0]?.canEditUser || user?.role === 'master';

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        {canEditUsers && (
          <Button onClick={() => { setEditingUser(undefined); setShowUserForm(true); }} className="mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        )}
      </div>

      <div className="mt-6">
        <div className="rounded-md border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPF
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{userItem.cpf}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{userItem.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{userItem.role === 'master' ? 'Administrador' : 'Usuário'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {getCompanyNames(userItem.companyIds || [])}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                    {canEditUsers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(userItem)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    )}
                    {(canEditUsers || user?.id === userItem.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangePassword(userItem.id)}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Alterar Senha
                      </Button>
                    )}
                    {canEditUsers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUserPassword(userItem.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Resetar Senha
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserForm 
        open={showUserForm}
        onOpenChange={handleCloseForm}
        editUser={editingUser}
      />

      <ChangePasswordForm
        open={showPasswordForm}
        onOpenChange={handleClosePasswordForm}
        userId={selectedUserId}
      />
    </div>
  );
};

export default UsersPage;
