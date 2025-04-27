
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/contexts/CompanyContext';
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
import { toast } from 'sonner';
import { Responsible } from '@/lib/types';
import { useEffect } from 'react';

interface ResponsibleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Responsible | null;
  isNewResponsible?: boolean;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(15, 'Telefone muito longo').optional().nullable(),
  department: z.string().min(2, 'Departamento deve ter pelo menos 2 caracteres'),
  role: z.string().min(2, 'Função deve ter pelo menos 2 caracteres'),
  type: z.enum(['responsible', 'requester']),
});

type FormValues = z.infer<typeof formSchema>;

const ResponsibleForm: React.FC<ResponsibleFormProps> = ({ 
  open, 
  onOpenChange, 
  initialData, 
  isNewResponsible = true 
}) => {
  const { addResponsible, updateResponsible } = useCompany();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      department: '',
      role: '',
      type: 'requester',
    },
  });

  // Populate form when in edit mode
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone || '',
        department: initialData.department || '',
        role: initialData.role || '',
        type: initialData.type || 'requester',
      });
    } else {
      // Reset form when not in edit mode
      form.reset({
        name: '',
        email: '',
        phone: '',
        department: '',
        role: '',
        type: 'requester',
      });
    }
  }, [initialData, form, open]);

  const onSubmit = (values: FormValues) => {
    try {
      if (initialData) {
        // Update existing responsible
        updateResponsible({
          ...initialData,
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          department: values.department,
          role: values.role,
          type: values.type,
          updatedAt: new Date()
        });

        toast.success("Responsável/Solicitante atualizado com sucesso!");
      } else {
        // Add new responsible
        addResponsible({
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          department: values.department,
          role: values.role,
          type: values.type,
        });
        
        toast.success("Responsável/Solicitante adicionado com sucesso!");
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error handling responsible:', error);
      toast.error("Ocorreu um erro ao salvar o responsável/solicitante");
    }
  };

  const getTitle = () => {
    if (initialData) {
      return initialData.type === 'requester' ? 'Editar Solicitante' : 'Editar Responsável';
    }
    return form.watch('type') === 'requester' ? 'Cadastrar Solicitante' : 'Cadastrar Responsável';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Edite as informações do responsável/solicitante para atribuição de ações.'
              : 'Adicione um novo responsável/solicitante para atribuição de ações.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="responsible">Responsável</SelectItem>
                      <SelectItem value="requester">Solicitante</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
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
                    <Input 
                      placeholder="joao.silva@empresa.com" 
                      type="email"
                      {...field} 
                    />
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
                    <Input 
                      placeholder="(xx) xxxxx-xxxx" 
                      type="tel"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Financeiro" 
                      {...field} 
                    />
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
                  <FormControl>
                    <Input 
                      placeholder="Ex: Analista" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{initialData ? 'Atualizar' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ResponsibleForm;
