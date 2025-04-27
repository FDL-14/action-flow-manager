import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { User } from '@/lib/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  cpf: z.string().min(11, {
    message: "CPF deve ter pelo menos 11 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  role: z.enum(['user', 'master']).default('user'),
  companyIds: z.array(z.string()).optional(),
  clientIds: z.array(z.string()).optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
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
  canCreateClient: z.boolean().default(false),
  canEditCompany: z.boolean().default(false),
  canDeleteCompany: z.boolean().default(false),
  viewOnlyAssignedActions: z.boolean().default(false),
})

type FormData = z.infer<typeof formSchema>

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser?: User;
}

const UserForm: React.FC<UserFormProps> = ({ open, onOpenChange, editUser }) => {
  const { addUser, updateUser, deleteUser } = useAuth();
  const { companies, clients } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editUser?.name || "",
      cpf: editUser?.cpf || "",
      email: editUser?.email || "",
      role: editUser?.role || 'user',
      companyIds: editUser?.companyIds || [],
      clientIds: editUser?.clientIds || [],
      department: editUser?.department || '',
      phone: editUser?.phone || '',
      canCreate: editUser?.permissions?.[0]?.canCreate || false,
      canEdit: editUser?.permissions?.[0]?.canEdit || false,
      canDelete: editUser?.permissions?.[0]?.canDelete || false,
      canMarkComplete: editUser?.permissions?.[0]?.canMarkComplete || false,
      canMarkDelayed: editUser?.permissions?.[0]?.canMarkDelayed || false,
      canAddNotes: editUser?.permissions?.[0]?.canAddNotes || false,
      canViewReports: editUser?.permissions?.[0]?.canViewReports || false,
      viewAllActions: editUser?.permissions?.[0]?.viewAllActions || false,
      canEditUser: editUser?.permissions?.[0]?.canEditUser || false,
      canEditAction: editUser?.permissions?.[0]?.canEditAction || false,
      canEditClient: editUser?.permissions?.[0]?.canEditClient || false,
      canDeleteClient: editUser?.permissions?.[0]?.canDeleteClient || false,
      canCreateClient: editUser?.permissions?.[0]?.canCreateClient || false,
      canEditCompany: editUser?.permissions?.[0]?.canEditCompany || false,
      canDeleteCompany: editUser?.permissions?.[0]?.canDeleteCompany || false,
      viewOnlyAssignedActions: editUser?.permissions?.[0]?.viewOnlyAssignedActions || false,
    },
  });

  useEffect(() => {
    form.reset({
      name: editUser?.name || "",
      cpf: editUser?.cpf || "",
      email: editUser?.email || "",
      role: editUser?.role || 'user',
      companyIds: editUser?.companyIds || [],
      clientIds: editUser?.clientIds || [],
      department: editUser?.department || '',
      phone: editUser?.phone || '',
      canCreate: editUser?.permissions?.[0]?.canCreate || false,
      canEdit: editUser?.permissions?.[0]?.canEdit || false,
      canDelete: editUser?.permissions?.[0]?.canDelete || false,
      canMarkComplete: editUser?.permissions?.[0]?.canMarkComplete || false,
      canMarkDelayed: editUser?.permissions?.[0]?.canMarkDelayed || false,
      canAddNotes: editUser?.permissions?.[0]?.canAddNotes || false,
      canViewReports: editUser?.permissions?.[0]?.canViewReports || false,
      viewAllActions: editUser?.permissions?.[0]?.viewAllActions || false,
      canEditUser: editUser?.permissions?.[0]?.canEditUser || false,
      canEditAction: editUser?.permissions?.[0]?.canEditAction || false,
      canEditClient: editUser?.permissions?.[0]?.canEditClient || false,
      canDeleteClient: editUser?.permissions?.[0]?.canDeleteClient || false,
      canCreateClient: editUser?.permissions?.[0]?.canCreateClient || false,
      canEditCompany: editUser?.permissions?.[0]?.canEditCompany || false,
      canDeleteCompany: editUser?.permissions?.[0]?.canDeleteCompany || false,
      viewOnlyAssignedActions: editUser?.permissions?.[0]?.viewOnlyAssignedActions || false,
    });
  }, [editUser, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      let success;
      
      if (editUser) {
        success = await updateUser(editUser.id, {
          name: data.name,
          cpf: data.cpf,
          email: data.email,
          role: data.role,
          companyIds: data.companyIds,
          clientIds: data.clientIds || [],
          department: data.department,
          phone: data.phone,
          permissions: [
            {
              id: editUser.permissions?.[0]?.id || '',
              name: '',
              description: '',
              canCreate: data.canCreate,
              canEdit: data.canEdit,
              canDelete: data.canDelete,
              canMarkComplete: data.canMarkComplete,
              canMarkDelayed: data.canMarkDelayed,
              canAddNotes: data.canAddNotes,
              canViewReports: data.canViewReports,
              viewAllActions: data.viewAllActions,
              canEditUser: data.canEditUser,
              canEditAction: data.canEditAction,
              canEditClient: data.canEditClient,
              canDeleteClient: data.canDeleteClient,
              canCreateClient: data.canCreateClient,
              canEditCompany: data.canEditCompany,
              canDeleteCompany: data.canDeleteCompany,
              viewOnlyAssignedActions: data.viewOnlyAssignedActions,
            }
          ]
        });
      } else {
        success = await addUser({
          name: data.name,
          cpf: data.cpf,
          email: data.email,
          role: data.role,
          companyIds: data.companyIds,
          clientIds: data.clientIds || [],
          department: data.department,
          phone: data.phone,
          permissions: [
            {
              id: 'new',
              name: '',
              description: '',
              canCreate: data.canCreate,
              canEdit: data.canEdit,
              canDelete: data.canDelete,
              canMarkComplete: data.canMarkComplete,
              canMarkDelayed: data.canMarkDelayed,
              canAddNotes: data.canAddNotes,
              canViewReports: data.canViewReports,
              viewAllActions: data.viewAllActions,
              canEditUser: data.canEditUser,
              canEditAction: data.canEditAction,
              canEditClient: data.canEditClient,
              canDeleteClient: data.canDeleteClient,
              canCreateClient: data.canCreateClient,
              canEditCompany: data.canEditCompany,
              canDeleteCompany: data.canDeleteCompany,
              viewOnlyAssignedActions: data.viewOnlyAssignedActions,
            }
          ]
        });
      }
  
      if (success) {
        onOpenChange(false);
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Erro ao salvar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      if (editUser) {
        const success = await deleteUser(editUser.id);
        if (success) {
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{editUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {editUser ? "Edite os campos do usuário." : "Adicione um novo usuário."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
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
                      <Input placeholder="CPF do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email do usuário" {...field} />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Departamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="companyIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresas</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {companies.map((company) => (
                      <div key={company.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`company-${company.id}`}
                          checked={field.value?.includes(company.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...(field.value || []), company.id]);
                            } else {
                              field.onChange(field.value?.filter((id) => id !== company.id));
                            }
                          }}
                        />
                        <Label htmlFor={`company-${company.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {company.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clientes</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}`}
                          checked={field.value?.includes(client.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...(field.value || []), client.id]);
                            } else {
                              field.onChange(field.value?.filter((id) => id !== client.id));
                            }
                          }}
                        />
                        <Label htmlFor={`client-${client.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {client.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <h3 className="text-lg font-medium">Permissões</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="canCreate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Criar</FormLabel>
                        <FormDescription>
                          Permissão para criar novos registros.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canEdit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Editar</FormLabel>
                        <FormDescription>
                          Permissão para editar registros existentes.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canDelete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Deletar</FormLabel>
                        <FormDescription>
                          Permissão para deletar registros.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canMarkComplete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Marcar como Completo</FormLabel>
                        <FormDescription>
                          Permissão para marcar ações como completas.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canMarkDelayed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Marcar como Atrasado</FormLabel>
                        <FormDescription>
                          Permissão para marcar ações como atrasadas.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canAddNotes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Adicionar Notas</FormLabel>
                        <FormDescription>
                          Permissão para adicionar notas às ações.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canViewReports"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Visualizar Relatórios</FormLabel>
                        <FormDescription>
                          Permissão para visualizar relatórios.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="viewAllActions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Visualizar Todas as Ações</FormLabel>
                        <FormDescription>
                          Permissão para visualizar todas as ações, independentemente da atribuição.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canEditUser"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Editar Usuários</FormLabel>
                        <FormDescription>
                          Permissão para editar informações de outros usuários.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canEditAction"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Editar Ações</FormLabel>
                        <FormDescription>
                          Permissão para editar informações das ações.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="canEditClient"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Editar Clientes</FormLabel>
                        <FormDescription>
                          Permissão para editar informações dos clientes.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canDeleteClient"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Deletar Clientes</FormLabel>
                        <FormDescription>
                          Permissão para deletar clientes.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canCreateClient"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Criar Clientes</FormLabel>
                        <FormDescription>
                          Permissão para criar novos clientes.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canEditCompany"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Editar Empresas</FormLabel>
                        <FormDescription>
                          Permissão para editar informações das empresas.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canDeleteCompany"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Deletar Empresas</FormLabel>
                        <FormDescription>
                          Permissão para deletar empresas.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="viewOnlyAssignedActions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Visualizar Apenas Ações Atribuídas</FormLabel>
                        <FormDescription>
                          Permissão para visualizar apenas as ações que foram atribuídas a este usuário.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {editUser && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <Trash className="mr-2 h-4 w-4 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá excluir o usuário permanentemente. Tem certeza que deseja
                        continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    Salvando...
                  </>
                ) : (
                  <>
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
