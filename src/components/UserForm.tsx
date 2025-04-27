
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser?: User;
}

const UserForm = ({ open, onOpenChange, editUser }: UserFormProps) => {
  const { addUser, updateUser } = useAuth();
  const { companies, clients } = useCompany();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'master'>('user');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canMarkComplete: true,
    canMarkDelayed: true,
    canAddNotes: true,
    canViewReports: false,
    viewAllActions: false,
    canEditUser: false,
    canEditAction: false,
    canEditClient: false,
    canDeleteClient: false,
    canCreateClient: false,
    canEditCompany: false,
    canDeleteCompany: false,
    viewOnlyAssignedActions: true,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      department: '',
      phone: '',
    }
  });

  useEffect(() => {
    if (editUser) {
      setValue('name', editUser.name);
      setValue('cpf', editUser.cpf);
      setValue('email', editUser.email || '');
      setValue('department', editUser.department || '');
      setValue('phone', editUser.phone || '');
      
      setSelectedRole(editUser.role);
      setSelectedCompanyIds(editUser.companyIds || []);
      setSelectedClientIds(editUser.clientIds || []);
      
      if (editUser.permissions && editUser.permissions.length > 0) {
        const userPermissions = editUser.permissions[0];
        setPermissions({
          canCreate: userPermissions.canCreate,
          canEdit: userPermissions.canEdit,
          canDelete: userPermissions.canDelete,
          canMarkComplete: userPermissions.canMarkComplete,
          canMarkDelayed: userPermissions.canMarkDelayed,
          canAddNotes: userPermissions.canAddNotes,
          canViewReports: userPermissions.canViewReports,
          viewAllActions: userPermissions.viewAllActions,
          canEditUser: userPermissions.canEditUser,
          canEditAction: userPermissions.canEditAction,
          canEditClient: userPermissions.canEditClient,
          canDeleteClient: userPermissions.canDeleteClient,
          canCreateClient: userPermissions.canCreateClient || false,
          canEditCompany: userPermissions.canEditCompany || false,
          canDeleteCompany: userPermissions.canDeleteCompany || false,
          viewOnlyAssignedActions: userPermissions.viewOnlyAssignedActions,
        });
      }
    } else {
      reset({
        name: '',
        cpf: '',
        email: '',
        department: '',
        phone: '',
      });
      setSelectedRole('user');
      setSelectedCompanyIds([]);
      setSelectedClientIds([]);
      setPermissions({
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canMarkComplete: true,
        canMarkDelayed: true,
        canAddNotes: true,
        canViewReports: false,
        viewAllActions: false,
        canEditUser: false,
        canEditAction: false,
        canEditClient: false,
        canDeleteClient: false,
        canCreateClient: false,
        canEditCompany: false,
        canDeleteCompany: false,
        viewOnlyAssignedActions: true,
      });
    }
  }, [editUser, setValue, reset]);

  // Update available clients based on selected companies
  useEffect(() => {
    if (selectedCompanyIds.length > 0) {
      const filteredClients = clients.filter(
        client => selectedCompanyIds.includes(client.companyId)
      );
      setAvailableClients(filteredClients);
    } else {
      setAvailableClients(clients);
    }
  }, [selectedCompanyIds, clients]);

  const toggleCompany = (companyId: string) => {
    if (selectedCompanyIds.includes(companyId)) {
      // Remove company and also remove any clients from that company
      setSelectedCompanyIds(prev => prev.filter(id => id !== companyId));
      setSelectedClientIds(prev => 
        prev.filter(clientId => {
          const client = clients.find(c => c.id === clientId);
          return client && client.companyId !== companyId;
        })
      );
    } else {
      setSelectedCompanyIds(prev => [...prev, companyId]);
    }
  };

  const toggleClient = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      setSelectedClientIds(prev => prev.filter(id => id !== clientId));
    } else {
      setSelectedClientIds(prev => [...prev, clientId]);
    }
  };

  const togglePermission = (permission: string) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission as keyof typeof prev]
    }));
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    
    try {
      const userData = {
        name: data.name,
        cpf: data.cpf,
        email: data.email,
        role: selectedRole,
        companyIds: selectedCompanyIds,
        clientIds: selectedClientIds,
        department: data.department,
        phone: data.phone,
        permissions: permissions
      };

      if (editUser) {
        await updateUser({
          ...userData,
          id: editUser.id
        });
        toast.success('Usuário atualizado com sucesso');
      } else {
        await addUser(userData);
        toast.success('Usuário criado com sucesso');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                {...register('name', { required: 'Nome é obrigatório' })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...register('cpf', { required: 'CPF é obrigatório' })}
              />
              {errors.cpf && (
                <p className="text-sm text-red-500">{errors.cpf.message?.toString()}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                {...register('department')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Função</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'user' | 'master')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="master">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Empresas</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-36 overflow-y-auto">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`company-${company.id}`} 
                      checked={selectedCompanyIds.includes(company.id)}
                      onCheckedChange={() => toggleCompany(company.id)}
                    />
                    <Label htmlFor={`company-${company.id}`} className="text-sm cursor-pointer">{company.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Clientes</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-36 overflow-y-auto">
                {availableClients.length > 0 ? (
                  availableClients.map((client) => (
                    <div key={client.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`client-${client.id}`} 
                        checked={selectedClientIds.includes(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                      />
                      <Label htmlFor={`client-${client.id}`} className="text-sm cursor-pointer">
                        {client.name} 
                        <span className="text-xs text-gray-500 block">
                          {companies.find(c => c.id === client.companyId)?.name || 'Sem empresa'}
                        </span>
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-2 text-center py-2">
                    {selectedCompanyIds.length === 0 
                      ? "Selecione uma empresa para ver seus clientes" 
                      : "Nenhum cliente disponível para as empresas selecionadas"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Permissões</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canCreate"
                    checked={permissions.canCreate}
                    onCheckedChange={() => togglePermission('canCreate')}
                  />
                  <Label htmlFor="canCreate" className="text-sm cursor-pointer">Criar ações</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canEdit"
                    checked={permissions.canEdit}
                    onCheckedChange={() => togglePermission('canEdit')}
                  />
                  <Label htmlFor="canEdit" className="text-sm cursor-pointer">Editar ações</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canDelete"
                    checked={permissions.canDelete}
                    onCheckedChange={() => togglePermission('canDelete')}
                  />
                  <Label htmlFor="canDelete" className="text-sm cursor-pointer">Excluir ações</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canMarkComplete"
                    checked={permissions.canMarkComplete}
                    onCheckedChange={() => togglePermission('canMarkComplete')}
                  />
                  <Label htmlFor="canMarkComplete" className="text-sm cursor-pointer">Marcar como concluído</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canMarkDelayed"
                    checked={permissions.canMarkDelayed}
                    onCheckedChange={() => togglePermission('canMarkDelayed')}
                  />
                  <Label htmlFor="canMarkDelayed" className="text-sm cursor-pointer">Marcar como atrasado</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canAddNotes"
                    checked={permissions.canAddNotes}
                    onCheckedChange={() => togglePermission('canAddNotes')}
                  />
                  <Label htmlFor="canAddNotes" className="text-sm cursor-pointer">Adicionar notas</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canViewReports"
                    checked={permissions.canViewReports}
                    onCheckedChange={() => togglePermission('canViewReports')}
                  />
                  <Label htmlFor="canViewReports" className="text-sm cursor-pointer">Ver relatórios</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="viewAllActions"
                    checked={permissions.viewAllActions}
                    onCheckedChange={() => togglePermission('viewAllActions')}
                  />
                  <Label htmlFor="viewAllActions" className="text-sm cursor-pointer">Ver todas as ações</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canEditUser"
                    checked={permissions.canEditUser}
                    onCheckedChange={() => togglePermission('canEditUser')}
                  />
                  <Label htmlFor="canEditUser" className="text-sm cursor-pointer">Gerenciar usuários</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canEditClient"
                    checked={permissions.canEditClient}
                    onCheckedChange={() => togglePermission('canEditClient')}
                  />
                  <Label htmlFor="canEditClient" className="text-sm cursor-pointer">Editar clientes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canCreateClient"
                    checked={permissions.canCreateClient}
                    onCheckedChange={() => togglePermission('canCreateClient')}
                  />
                  <Label htmlFor="canCreateClient" className="text-sm cursor-pointer">Cadastrar clientes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canDeleteClient"
                    checked={permissions.canDeleteClient}
                    onCheckedChange={() => togglePermission('canDeleteClient')}
                  />
                  <Label htmlFor="canDeleteClient" className="text-sm cursor-pointer">Excluir clientes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canEditCompany"
                    checked={permissions.canEditCompany}
                    onCheckedChange={() => togglePermission('canEditCompany')}
                  />
                  <Label htmlFor="canEditCompany" className="text-sm cursor-pointer">Editar empresas</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canDeleteCompany"
                    checked={permissions.canDeleteCompany}
                    onCheckedChange={() => togglePermission('canDeleteCompany')}
                  />
                  <Label htmlFor="canDeleteCompany" className="text-sm cursor-pointer">Excluir empresas</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="viewOnlyAssignedActions"
                    checked={permissions.viewOnlyAssignedActions}
                    onCheckedChange={() => togglePermission('viewOnlyAssignedActions')}
                  />
                  <Label htmlFor="viewOnlyAssignedActions" className="text-sm cursor-pointer">Ver apenas ações atribuídas</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
