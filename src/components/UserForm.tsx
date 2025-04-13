
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser?: User;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  email: z.string().email('Email inválido'),
  role: z.enum(['user', 'master']),
  companyIds: z.array(z.string()).min(1, 'Selecione pelo menos uma empresa'),
  clientIds: z.array(z.string()).optional(),
  permissions: z.object({
    canCreate: z.boolean().default(false),
    canEdit: z.boolean().default(false),
    canDelete: z.boolean().default(false),
    canMarkComplete: z.boolean().default(false),
    canMarkDelayed: z.boolean().default(false),
    canAddNotes: z.boolean().default(false),
    canViewReports: z.boolean().default(false),
    viewAllActions: z.boolean().default(false),
    canEditUser: z.boolean().default(false),
    canEditAction: z.boolean().default(false),
    canEditClient: z.boolean().default(false),
    canDeleteClient: z.boolean().default(false),
    viewOnlyAssignedActions: z.boolean().default(false),
  })
});

type FormValues = z.infer<typeof formSchema>;

const UserForm: React.FC<UserFormProps> = ({ open, onOpenChange, editUser }) => {
  const { addUser, updateUser } = useAuth();
  const { companies, clients } = useCompany();
  const { toast } = useToast();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      role: 'user' as const,
      companyIds: [],
      clientIds: [],
      permissions: {
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
        viewOnlyAssignedActions: true,
      }
    },
  });

  useEffect(() => {
    if (editUser) {
      const permissions = editUser.permissions[0] || {};
      
      form.reset({
        name: editUser.name,
        cpf: editUser.cpf,
        email: editUser.email,
        role: editUser.role,
        companyIds: editUser.companyIds || [],
        clientIds: editUser.clientIds || [],
        permissions: {
          canCreate: permissions.canCreate || false,
          canEdit: permissions.canEdit || false, 
          canDelete: permissions.canDelete || false,
          canMarkComplete: permissions.canMarkComplete || true,
          canMarkDelayed: permissions.canMarkDelayed || true,
          canAddNotes: permissions.canAddNotes || true,
          canViewReports: permissions.canViewReports || false,
          viewAllActions: permissions.viewAllActions || false,
          canEditUser: permissions.canEditUser || false,
          canEditAction: permissions.canEditAction || false,
          canEditClient: permissions.canEditClient || false,
          canDeleteClient: permissions.canDeleteClient || false,
          viewOnlyAssignedActions: permissions.viewOnlyAssignedActions || true,
        }
      });
      
      setSelectedCompanies(editUser.companyIds || []);
      setSelectedClients(editUser.clientIds || []);
    } else {
      form.reset({
        name: '',
        cpf: '',
        email: '',
        role: 'user',
        companyIds: [],
        clientIds: [],
        permissions: {
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
          viewOnlyAssignedActions: true,
        }
      });
      setSelectedCompanies([]);
      setSelectedClients([]);
    }
  }, [editUser, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (editUser) {
        const success = await updateUser({
          id: editUser.id,
          ...data
        });
        
        if (success) {
          onOpenChange(false);
        }
      } else {
        const success = await addUser(data);
        
        if (success) {
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error submitting user form:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleCompanyChange = (companyId: string) => {
    const newSelection = selectedCompanies.includes(companyId)
      ? selectedCompanies.filter(id => id !== companyId)
      : [...selectedCompanies, companyId];
    
    setSelectedCompanies(newSelection);
    form.setValue('companyIds', newSelection);
  };

  const handleClientChange = (clientId: string) => {
    const newSelection = selectedClients.includes(clientId)
      ? selectedClients.filter(id => id !== clientId)
      : [...selectedClients, clientId];
    
    setSelectedClients(newSelection);
    form.setValue('clientIds', newSelection);
  };

  const availableClients = clients.filter(client => 
    selectedCompanies.includes(client.companyId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {editUser ? 'Edite as informações do usuário.' : 'Adicione um novo usuário ao sistema.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o CPF sem pontuação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="master">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Empresas Associadas</FormLabel>
              <p className="text-sm text-gray-500 mb-2">
                Selecione as empresas às quais este usuário terá acesso
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-3">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`company-${company.id}`}
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={() => handleCompanyChange(company.id)}
                    />
                    <label
                      htmlFor={`company-${company.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {company.name}
                    </label>
                  </div>
                ))}
              </div>
              {form.formState.errors.companyIds && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.companyIds.message}
                </p>
              )}
            </div>
            
            {selectedCompanies.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Clientes Associados</FormLabel>
                <p className="text-sm text-gray-500 mb-2">
                  Selecione os clientes aos quais este usuário terá acesso
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                  {availableClients.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Não há clientes disponíveis para as empresas selecionadas
                    </p>
                  ) : (
                    availableClients.map((client) => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}`}
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={() => handleClientChange(client.id)}
                        />
                        <label
                          htmlFor={`client-${client.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {client.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium">Permissões</h3>
                <p className="text-sm text-gray-500">
                  Configure as permissões deste usuário
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="permissions.viewAllActions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ver Todas as Ações</FormLabel>
                        <p className="text-sm text-gray-500">
                          Visualiza todas as ações do sistema
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.viewOnlyAssignedActions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ver Apenas Ações Atribuídas</FormLabel>
                        <p className="text-sm text-gray-500">
                          Visualiza apenas ações designadas ao usuário
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canCreate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Criar Ações</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode criar novas ações
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canEdit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Editar Ações</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode editar ações existentes
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canEditAction"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Editar Detalhes da Ação</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode editar detalhes das ações
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canDelete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Excluir Ações</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode excluir ações
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canMarkComplete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Concluir Ações</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode marcar ações como concluídas
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canMarkDelayed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Marcar Atrasos</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode marcar ações como atrasadas
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canAddNotes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Adicionar Anotações</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode adicionar anotações às ações
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canViewReports"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ver Relatórios</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode visualizar relatórios
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canEditUser"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Gerenciar Usuários</FormLabel>
                        <p className="text-sm text-gray-500">
                          Pode adicionar e editar outros usuários
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canEditClient"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Editar Clientes</FormLabel>
                        <p className="text-sm text-gray-500">
                          Permissão para editar clientes
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions.canDeleteClient"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Excluir Clientes</FormLabel>
                        <p className="text-sm text-gray-500">
                          Permissão para excluir clientes
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editUser ? 'Atualizar Usuário' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
