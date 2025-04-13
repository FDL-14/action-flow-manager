
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { User, Client } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser?: User;
}

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres",
  }),
  cpf: z.string().min(11, {
    message: "CPF deve ter 11 dígitos",
  }),
  email: z.string().email({
    message: "Email inválido",
  }),
  role: z.enum(["user", "master"], {
    required_error: "Selecione um papel",
  }),
  // Company fields
  companyIds: z.array(z.string()).min(1, {
    message: "Selecione pelo menos uma empresa",
  }),
  clientIds: z.array(z.string()).optional(),
  // Permissões básicas
  canCreate: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canMarkComplete: z.boolean().default(true),
  canMarkDelayed: z.boolean().default(true),
  canAddNotes: z.boolean().default(true),
  canViewReports: z.boolean().default(false),
  viewAllActions: z.boolean().default(false),
  canEditUser: z.boolean().default(false),
  canEditAction: z.boolean().default(false),
  canEditClient: z.boolean().default(false),
  canDeleteClient: z.boolean().default(false),
  viewOnlyAssignedActions: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const UserForm: React.FC<UserFormProps> = ({ open, onOpenChange, editUser }) => {
  const { addUser, updateUser } = useAuth();
  const { companies, clients: allClients } = useCompany();
  const { toast } = useToast();
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      role: "user",
      companyIds: [],
      clientIds: [],
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
      viewOnlyAssignedActions: false,
    },
  });

  useEffect(() => {
    if (editUser) {
      form.reset({
        name: editUser.name,
        cpf: editUser.cpf,
        email: editUser.email,
        role: editUser.role,
        companyIds: editUser.companyIds || [],
        clientIds: editUser.clientIds || [],
        canCreate: editUser.permissions[0]?.canCreate || false,
        canEdit: editUser.permissions[0]?.canEdit || false,
        canDelete: editUser.permissions[0]?.canDelete || false,
        canMarkComplete: editUser.permissions[0]?.canMarkComplete || true,
        canMarkDelayed: editUser.permissions[0]?.canMarkDelayed || true,
        canAddNotes: editUser.permissions[0]?.canAddNotes || true,
        canViewReports: editUser.permissions[0]?.canViewReports || false,
        viewAllActions: editUser.permissions[0]?.viewAllActions || false,
        canEditUser: editUser.permissions[0]?.canEditUser || false,
        canEditAction: editUser.permissions[0]?.canEditAction || false,
        canEditClient: editUser.permissions[0]?.canEditClient || false,
        canDeleteClient: editUser.permissions[0]?.canDeleteClient || false,
        viewOnlyAssignedActions: editUser.permissions[0]?.viewOnlyAssignedActions || false,
      });
      
      setSelectedCompanies(editUser.companyIds || []);
    } else {
      form.reset({
        name: "",
        cpf: "",
        email: "",
        role: "user",
        companyIds: [],
        clientIds: [],
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
        viewOnlyAssignedActions: false,
      });
      
      setSelectedCompanies([]);
    }
  }, [editUser, form]);

  useEffect(() => {
    // Filter clients based on selected companies
    if (selectedCompanies.length > 0) {
      const filtered = allClients.filter(client => 
        selectedCompanies.includes(client.companyId)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients([]);
    }
    
    // Clear selected clients that don't belong to selected companies
    const currentClientIds = form.getValues("clientIds") || [];
    if (currentClientIds.length > 0) {
      const validClientIds = currentClientIds.filter(clientId => {
        const client = allClients.find(c => c.id === clientId);
        return client && selectedCompanies.includes(client.companyId);
      });
      
      if (validClientIds.length !== currentClientIds.length) {
        form.setValue("clientIds", validClientIds);
      }
    }
  }, [selectedCompanies, allClients, form]);

  // Update selected companies when companyIds changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "companyIds") {
        setSelectedCompanies(value.companyIds as string[] || []);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: FormValues) {
    try {
      const permissions = {
        canCreate: values.role === 'master' ? true : values.canCreate,
        canEdit: values.role === 'master' ? true : values.canEdit,
        canDelete: values.role === 'master' ? true : values.canDelete,
        canMarkComplete: values.canMarkComplete,
        canMarkDelayed: values.canMarkDelayed,
        canAddNotes: values.canAddNotes,
        canViewReports: values.role === 'master' ? true : values.canViewReports,
        viewAllActions: values.role === 'master' ? true : values.viewAllActions,
        canEditUser: values.role === 'master' ? true : values.canEditUser,
        canEditAction: values.role === 'master' ? true : values.canEditAction,
        canEditClient: values.role === 'master' ? true : values.canEditClient,
        canDeleteClient: values.role === 'master' ? true : values.canDeleteClient,
        viewOnlyAssignedActions: values.role === 'master' ? false : values.viewOnlyAssignedActions,
      };

      let success;
      if (editUser) {
        success = await updateUser({
          id: editUser.id,
          name: values.name,
          cpf: values.cpf,
          email: values.email,
          role: values.role,
          companyIds: values.companyIds,
          clientIds: values.clientIds,
          permissions
        });
      } else {
        success = await addUser({
          name: values.name,
          cpf: values.cpf,
          email: values.email,
          role: values.role,
          companyIds: values.companyIds,
          clientIds: values.clientIds,
          permissions
        });
      }

      if (success) {
        onOpenChange(false);
        form.reset();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o usuário",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {editUser 
              ? 'Atualize as informações do usuário' 
              : 'Preencha as informações para criar um novo usuário'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
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
                      <Input placeholder="Apenas números" {...field} />
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
                      <Input placeholder="email@exemplo.com" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="master">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Administradores têm todas as permissões por padrão.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">Associação a Empresas e Clientes</h3>

              <FormField
                control={form.control}
                name="companyIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Empresas</FormLabel>
                    <FormDescription>
                      Selecione as empresas às quais este usuário terá acesso
                    </FormDescription>
                    <div className="mt-2 space-y-2">
                      <ScrollArea className="h-[100px] border rounded-md p-2">
                        {companies.map((company) => (
                          <FormField
                            key={company.id}
                            control={form.control}
                            name="companyIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={company.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(company.id)}
                                      onCheckedChange={(checked) => {
                                        const updatedCompanies = checked
                                          ? [...field.value, company.id]
                                          : field.value?.filter(
                                              (value) => value !== company.id
                                            );
                                        field.onChange(updatedCompanies);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {company.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </ScrollArea>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {filteredClients.length > 0 && (
                <FormField
                  control={form.control}
                  name="clientIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Clientes</FormLabel>
                      <FormDescription>
                        Selecione os clientes aos quais este usuário terá acesso
                      </FormDescription>
                      <div className="mt-2 space-y-2">
                        <ScrollArea className="h-[100px] border rounded-md p-2">
                          {filteredClients.map((client) => (
                            <FormField
                              key={client.id}
                              control={form.control}
                              name="clientIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={client.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(client.id)}
                                        onCheckedChange={(checked) => {
                                          const updatedClients = checked
                                            ? [...(field.value || []), client.id]
                                            : (field.value || [])?.filter(
                                                (value) => value !== client.id
                                              );
                                          field.onChange(updatedClients);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {client.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </ScrollArea>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">Permissões</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="canCreate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Criar Ações</FormLabel>
                        <FormDescription>
                          Permissão para criar novas ações
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={form.watch("role") === "master"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canEdit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Editar Ações</FormLabel>
                        <FormDescription>
                          Permissão para editar ações existentes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={form.watch("role") === "master"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canDelete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Excluir Ações</FormLabel>
                        <FormDescription>
                          Permissão para excluir ações
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={form.watch("role") === "master"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canEditClient"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Editar Clientes</FormLabel>
                        <FormDescription>
                          Permissão para editar clientes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={form.watch("role") === "master"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canDeleteClient"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Excluir Clientes</FormLabel>
                        <FormDescription>
                          Permissão para excluir clientes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={form.watch("role") === "master"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="viewAllActions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ver Todas as Ações</FormLabel>
                        <FormDescription>
                          Visualiza todas as ações do sistema
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(value) => {
                            field.onChange(value);
                            if (value) {
                              form.setValue("viewOnlyAssignedActions", false);
                            }
                          }}
                          disabled={form.watch("role") === "master"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="viewOnlyAssignedActions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ver Apenas Ações Atribuídas</FormLabel>
                        <FormDescription>
                          Visualiza apenas ações designadas ao usuário
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(value) => {
                            field.onChange(value);
                            if (value) {
                              form.setValue("viewAllActions", false);
                            }
                          }}
                          disabled={form.watch("role") === "master" || form.watch("viewAllActions")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canEditUser"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Gerenciar Usuários</FormLabel>
                        <FormDescription>
                          Permite adicionar e editar outros usuários
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={form.watch("role") === "master"}
                        />
                      </FormControl>
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
