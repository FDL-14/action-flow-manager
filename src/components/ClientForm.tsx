
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
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { CompanySelector } from './client/CompanySelector';
import { ClientBasicInfo } from './client/ClientBasicInfo';
import { ClientAdditionalInfo } from './client/ClientAdditionalInfo';

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
      
      if (!values.companyId) {
        toast.error("Empresa obrigatória", {
          description: "Selecione uma empresa para continuar."
        });
        return;
      }
      
      const selectedCompany = companies.find(c => c.id === values.companyId);
      if (!selectedCompany) {
        toast.error("Empresa inválida", {
          description: "A empresa selecionada não foi encontrada."
        });
        return;
      }
      
      console.log("Associando cliente à empresa:", selectedCompany.name, selectedCompany.id);
      
      if (editClient) {
        await updateClient({
          ...editClient,
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          cnpj: values.cnpj || undefined,
          companyId: values.companyId,
          updatedAt: new Date(),
        });
        
        toast.success("Cliente atualizado com sucesso");
      } else {
        await addClient({
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          cnpj: values.cnpj || undefined,
          companyId: values.companyId,
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
            <CompanySelector 
              form={form}
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
            />
            
            <ClientBasicInfo form={form} />
            <ClientAdditionalInfo form={form} />

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
