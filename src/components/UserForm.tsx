
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
import { User } from '@/lib/types';
import { useEffect } from 'react';

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
  // Novas permissões para clientes
  canEditClient: z.boolean().default(false),
  canDeleteClient: z.boolean().default(false),
  // Nova permissão para visualização de ações
  viewOnlyAssignedActions: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const UserForm: React.FC<UserFormProps> = ({ open, onOpenChange, editUser }) => {
  const { addUser, updateUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      role: "user",
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
    }
  }, [editUser, form]);

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
          permissions
        });
      } else {
        success = await addUser({
          name: values.name,
          cpf: values.cpf,
          email: values.email,
          role: values.role,
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
      <DialogContent className="sm:max-w-[600px]">
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
