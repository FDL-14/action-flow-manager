
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useCompany } from '@/contexts/CompanyContext';
import UserForm from '@/components/UserForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { User } from '@/contexts/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const UsersPage = () => {
  const { companies } = useCompany();
  const { users, resetUserPassword, user } = useAuth();
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

  // Função para exibir os nomes das empresas sem repetição
  const getCompanyNames = (companyIds: string[]) => {
    if (!companyIds || companyIds.length === 0) return 'Nenhuma empresa associada';
    
    const companyNames = companyIds.map(companyId => {
      const company = companies.find(c => c.id === companyId);
      return company ? company.name : 'Não encontrada';
    });
    
    // Remove duplicados do array de nomes
    const uniqueCompanyNames = [...new Set(companyNames)];
    return uniqueCompanyNames.join(', ');
  };

  // Apenas mostra botões de edição para usuários que o usuário atual tem permissão para editar
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell className="font-medium">{userItem.name}</TableCell>
                  <TableCell>{userItem.cpf}</TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>{userItem.role === 'master' ? 'Administrador' : 'Usuário'}</TableCell>
                  <TableCell>{getCompanyNames(userItem.companyIds || [])}</TableCell>
                  <TableCell className="flex justify-end space-x-2">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
