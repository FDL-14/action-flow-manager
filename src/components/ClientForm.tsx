
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/lib/types';
import { useEffect } from 'react';

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClient?: Client;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ClientForm: React.FC<ClientFormProps> = ({ open, onOpenChange, editClient }) => {
  const { addClient, updateClient } = useCompany();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Populate form when in edit mode
  useEffect(() => {
    if (editClient) {
      form.reset({
        name: editClient.name,
        email: editClient.email || '',
        phone: editClient.phone || '',
      });
    } else {
      // Reset form when not in edit mode
      form.reset({
        name: '',
        email: '',
        phone: '',
      });
    }
  }, [editClient, form, open]);

  const onSubmit = (values: FormValues) => {
    try {
      if (editClient) {
        // Update existing client
        updateClient({
          ...editClient,
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          updatedAt: new Date()
        });

        toast({
          title: "Cliente atualizado",
          description: "O cliente foi atualizado com sucesso!",
          variant: "default",
        });
      } else {
        // Add new client
        addClient({
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
        });
        
        toast({
          title: "Cliente adicionado",
          description: "O cliente foi adicionado com sucesso!",
          variant: "default",
        });
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error handling client:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o cliente",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editClient ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle>
          <DialogDescription>
            {editClient 
              ? 'Edite as informações do cliente.'
              : 'Adicione um novo cliente ao sistema.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa XYZ" {...field} />
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
                      placeholder="contato@empresa.com" 
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
                      placeholder="(00) 00000-0000" 
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
              <Button type="submit">{editClient ? 'Atualizar' : 'Salvar Cliente'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
