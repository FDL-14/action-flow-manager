
import { useState } from 'react';
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

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
});

type FormValues = z.infer<typeof formSchema>;

const UserForm: React.FC<UserFormProps> = ({ open, onOpenChange }) => {
  const { addUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cpf: '',
      role: 'user',
      canCreate: false,
      canEdit: false, 
      canDelete: false,
      canMarkComplete: true,
      canMarkDelayed: true,
      canAddNotes: true,
      canViewReports: false,
      viewAllActions: false,
    },
  });

  const roleValue = form.watch('role');

  // Update permissions when role changes
  // Fix here - useState was used incorrectly. It should be useEffect
  useState(() => {
    if (roleValue === 'master') {
      form.setValue('canCreate', true);
      form.setValue('canEdit', true);
      form.setValue('canDelete', true);
      form.setValue('canViewReports', true);
      form.setValue('viewAllActions', true);
    }
  }, [roleValue, form]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await addUser({
        name: values.name,
        cpf: values.cpf,
        role: values.role,
        permissions: {
          canCreate: values.canCreate,
          canEdit: values.canEdit,
          canDelete: values.canDelete,
          canMarkComplete: values.canMarkComplete,
          canMarkDelayed: values.canMarkDelayed,
          canAddNotes: values.canAddNotes,
          canViewReports: values.canViewReports,
          viewAllActions: values.viewAllActions,
        }
      });
      
      form.reset();
      onOpenChange(false);
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso. A senha padrão é @54321",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o usuário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário para acessar o sistema.
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

            <div className="border rounded-md p-4">
              <h3 className="text-md font-medium mb-3">Permissões</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
