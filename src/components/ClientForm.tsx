
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/contexts/CompanyContext';
import { Client } from '@/lib/types';
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
import { toast } from "sonner";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClient?: Client | null;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  cnpj: z.string().optional().or(z.literal('')),
  companyId: z.string({
    required_error: "A empresa é obrigatória",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const ClientForm: React.FC<ClientFormProps> = ({ open, onOpenChange, editClient }) => {
  const { addClient, updateClient, companies, company } = useCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      cnpj: '',
      companyId: company?.id || '',
    },
    mode: 'onChange',
  });

  // Reset form when dialog opens or editClient changes
  useEffect(() => {
    if (open) {
      console.log("Formulário aberto, empresa atual:", company?.id);
      
      if (editClient) {
        console.log("Editando cliente:", editClient);
        console.log("Company ID do cliente:", editClient.companyId);
        
        const companyIdToUse = editClient.companyId || company?.id || '';
        setSelectedCompanyId(companyIdToUse);
        
        form.reset({
          name: editClient.name,
          email: editClient.email || '',
          phone: editClient.phone || '',
          address: editClient.address || '',
          cnpj: editClient.cnpj || '',
          companyId: companyIdToUse,
        });
      } else {
        console.log("Formulário para novo cliente");
        
        const companyIdToUse = company?.id || '';
        setSelectedCompanyId(companyIdToUse);
        
        form.reset({
          name: '',
          email: '',
          phone: '',
          address: '',
          cnpj: '',
          companyId: companyIdToUse,
        });
      }
    }
  }, [editClient, form, company, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Enviando dados do formulário:", values);
      console.log("Company ID selecionada:", values.companyId);
      
      if (!values.companyId) {
        toast.error("Empresa obrigatória", {
          description: "Selecione uma empresa para continuar."
        });
        return;
      }
      
      // Find the selected company to verify it exists
      const selectedCompany = companies.find(c => c.id === values.companyId);
      if (!selectedCompany) {
        toast.error("Empresa inválida", {
          description: "A empresa selecionada não foi encontrada."
        });
        return;
      }
      
      // Log the company being associated with the client
      console.log("Associando cliente à empresa:", selectedCompany.name, selectedCompany.id);
      
      if (editClient) {
        // Update existing client
        await updateClient({
          ...editClient,
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          cnpj: values.cnpj || undefined,
          companyId: values.companyId, // Ensure we pass the company ID explicitly
          updatedAt: new Date(),
        });
        
        toast.success("Cliente atualizado com sucesso");
      } else {
        // Create new client
        await addClient({
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          cnpj: values.cnpj || undefined,
          companyId: values.companyId, // Ensure we pass the company ID explicitly
        });
        
        toast.success("Cliente adicionado com sucesso");
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting client form:', error);
      toast.error("Erro ao salvar", {
        description: "Ocorreu um erro ao salvar o cliente. Por favor, tente novamente."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {editClient 
              ? 'Edite as informações do cliente abaixo.' 
              : 'Preencha os detalhes do novo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      console.log("Empresa selecionada:", value);
                      setSelectedCompanyId(value);
                      field.onChange(value);
                      
                      // Force field validation after selection to ensure it's recognized
                      form.trigger("companyId");
                    }}
                    value={selectedCompanyId || field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white min-w-[240px] max-h-[300px] overflow-y-auto z-50">
                      {companies.length > 0 ? (
                        companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_companies" disabled>
                          Nenhuma empresa disponível
                        </SelectItem>
                      )}
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
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nome da Empresa Cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: cliente@exemplo.com" {...field} />
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
                      <Input placeholder="Ex: (11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua Exemplo, 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 00.000.000/0001-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editClient ? 'Atualizar Cliente' : 'Adicionar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
