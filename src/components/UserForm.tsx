
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useCompany } from '@/contexts/CompanyContext';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { User } from '@/lib/types';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser?: User;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter pelo menos 11 dígitos').max(14, 'CPF não pode ter mais que 14 caracteres'),
  role: z.enum(['user', 'master'], {
    required_error: "Você deve selecionar uma função",
  }),
  canCreate: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canMarkComplete: z.boolean().default(true),
  canMarkDelayed: z.boolean().default(true),
  canAddNotes: z.boolean().default(true),
  canViewReports: z.boolean().default(false),
  viewAllActions: z.boolean().default(false),
  canEditUser: z.boolean().default(false), // New permission
  canEditAction: z.boolean().default(false), // New permission
  companyIds: z.array(z.string()).min(1, "Selecione pelo menos uma empresa"),
});

type FormValues = z.infer<typeof formSchema>;

const UserForm: React.FC<UserFormProps> = ({ open, onOpenChange, editUser }) => {
  const { addUser, updateUser } = useAuth();
  const { toast } = useToast();
  const { company, clients } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editUser?.name || '',
      cpf: editUser?.cpf || '',
      role: editUser?.role || 'user',
      canCreate: editUser?.permissions?.[0]?.canCreate || false,
      canEdit: editUser?.permissions?.[0]?.canEdit || false, 
      canDelete: editUser?.permissions?.[0]?.canDelete || false,
      canMarkComplete: editUser?.permissions?.[0]?.canMarkComplete || true,
      canMarkDelayed: editUser?.permissions?.[0]?.canMarkDelayed || true,
      canAddNotes: editUser?.permissions?.[0]?.canAddNotes || true,
      canViewReports: editUser?.permissions?.[0]?.canViewReports || false,
      viewAllActions: editUser?.permissions?.[0]?.viewAllActions || false,
      canEditUser: editUser?.permissions?.[0]?.canEditUser || false, // New permission
      canEditAction: editUser?.permissions?.[0]?.canEditAction || false, // New permission
      companyIds: editUser?.companyIds || [company?.id || ''],
    },
  });

  const roleValue = form.watch('role');

  // Initialize company selection
  useEffect(() => {
    if (company) {
      if (editUser?.companyIds) {
        setSelectedCompanies(editUser.companyIds);
        form.setValue('companyIds', editUser.companyIds);
      } else {
        setSelectedCompanies([company.id]);
        form.setValue('companyIds', [company.id]);
      }
    }
  }, [company, editUser, form]);

  // Update permissions when role changes
  useEffect(() => {
    if (roleValue === 'master') {
      form.setValue('canCreate', true);
      form.setValue('canEdit', true);
      form.setValue('canDelete', true);
      form.setValue('canViewReports', true);
      form.setValue('viewAllActions', true);
      form.setValue('canEditUser', true);
      form.setValue('canEditAction', true);
    }
  }, [roleValue, form]);

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev => {
      const isSelected = prev.includes(companyId);
      const newSelection = isSelected
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId];
      
      form.setValue('companyIds', newSelection);
      return newSelection;
    });
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (editUser) {
        await updateUser({
          id: editUser.id,
          name: values.name,
          cpf: values.cpf,
          role: values.role,
          companyIds: values.companyIds,
          permissions: {
            canCreate: values.canCreate,
            canEdit: values.canEdit,
            canDelete: values.canDelete,
            canMarkComplete: values.canMarkComplete,
            canMarkDelayed: values.canMarkDelayed,
            canAddNotes: values.canAddNotes,
            canViewReports: values.canViewReports,
            viewAllActions: values.viewAllActions,
            canEditUser: values.canEditUser,
            canEditAction: values.canEditAction,
          }
        });
        
        toast({
          title: "Usuário atualizado",
          description: "O usuário foi atualizado com sucesso.",
          variant: "default",
        });
      } else {
        await addUser({
          name: values.name,
          cpf: values.cpf,
          role: values.role,
          companyIds: values.companyIds,
          permissions: {
            canCreate: values.canCreate,
            canEdit: values.canEdit,
            canDelete: values.canDelete,
            canMarkComplete: values.canMarkComplete,
            canMarkDelayed: values.canMarkDelayed,
            canAddNotes: values.canAddNotes,
            canViewReports: values.canViewReports,
            viewAllActions: values.viewAllActions,
            canEditUser: values.canEditUser,
            canEditAction: values.canEditAction,
          }
        });
        
        toast({
          title: "Usuário criado",
          description: "O usuário foi criado com sucesso. A senha padrão é @54321",
          variant: "default",
        });
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o usuário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {editUser ? 'Edite as informações do usuário.' : 'Crie um novo usuário para acessar o sistema.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do usuário" {...field} />
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
                    <Input placeholder="CPF do usuário (apenas números)" {...field} />
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

            <Accordion type="single" collapsible className="w-full border rounded-md">
              <AccordionItem value="companies">
                <AccordionTrigger className="px-4 font-medium">
                  Empresas Associadas
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <FormField
                    control={form.control}
                    name="companyIds"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormDescription>
                            Selecione as empresas que este usuário terá acesso
                          </FormDescription>
                          <FormMessage />
                        </div>
                        <div className="space-y-2">
                          {company && (
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`company-${company.id}`}
                                checked={selectedCompanies.includes(company.id)}
                                onCheckedChange={() => toggleCompany(company.id)}
                              />
                              <label 
                                htmlFor={`company-${company.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {company.name} (Principal)
                              </label>
                            </div>
                          )}
                          {clients.map(client => (
                            <div key={client.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`company-${client.id}`}
                                checked={selectedCompanies.includes(client.id)}
                                onCheckedChange={() => toggleCompany(client.id)}
                              />
                              <label 
                                htmlFor={`company-${client.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {client.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="permissions">
                <AccordionTrigger className="px-4 font-medium">
                  Permissões
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="viewAllActions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Ver todas as ações</FormLabel>
                            <FormDescription>
                              Pode ver ações de outros usuários
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="canCreate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Criar ações</FormLabel>
                            <FormDescription>
                              Pode criar novas ações
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canEdit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Editar ações</FormLabel>
                            <FormDescription>
                              Pode editar ações existentes
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canEditAction"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Editar Ação</FormLabel>
                            <FormDescription>
                              Pode editar detalhes das ações
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canDelete"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Excluir ações</FormLabel>
                            <FormDescription>
                              Pode excluir ações
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canMarkComplete"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Concluir ações</FormLabel>
                            <FormDescription>
                              Pode marcar ações como concluídas
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canEditUser"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Editar Usuários</FormLabel>
                            <FormDescription>
                              Pode editar informações de usuários
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canMarkDelayed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Marcar atrasos</FormLabel>
                            <FormDescription>
                              Pode marcar ações como atrasadas
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canAddNotes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Adicionar anotações</FormLabel>
                            <FormDescription>
                              Pode adicionar anotações às ações
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canViewReports"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Ver relatórios</FormLabel>
                            <FormDescription>
                              Pode visualizar relatórios
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (editUser ? "Atualizando..." : "Criando...") : (editUser ? "Atualizar Usuário" : "Criar Usuário")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
