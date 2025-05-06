
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Client } from '@/lib/types';
import { useCompany } from '@/contexts/CompanyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CompanySelector } from '@/components/client/CompanySelector';
import { ensureSupabaseCompanyExists } from '@/hooks/client/supabase/company-operations';

// Define form schema with validation
const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter no mínimo 2 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  companyId: z.string({ required_error: "Selecione uma empresa" })
    .min(1, { message: 'Selecione uma empresa' }),
  companyName: z.string().optional(),
});

export interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Client | null;
  editClient?: Client;
  isNewClient?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({
  open,
  onOpenChange,
  initialData,
  editClient,
  isNewClient = false
}) => {
  const { addClient, updateClient, companies } = useCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  // Use editClient or initialData for backwards compatibility
  const clientData = editClient || initialData;
  const isNew = isNewClient || !clientData;
  
  // Initialize form with schema
  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: clientData?.name || '',
      email: clientData?.email || '',
      phone: clientData?.phone || '',
      companyId: clientData?.companyId || '',
      companyName: clientData?.companyName || '',
    },
  });

  // Reset form when initialData/editClient changes
  useEffect(() => {
    if (open) {
      if (clientData) {
        // Ensure company name is set
        let companyName = clientData.companyName;
        if (!companyName && clientData.companyId) {
          const company = companies.find(c => c.id === clientData.companyId);
          if (company) {
            companyName = company.name;
          }
        }
        
        form.reset({
          name: clientData.name,
          email: clientData.email || '',
          phone: clientData.phone || '',
          companyId: clientData.companyId || '',
          companyName: companyName || '',
        });
        
        setSelectedCompanyId(clientData.companyId || '');
      } else {
        // Para novos clientes, inicializar com a primeira empresa disponível se houver
        const defaultCompanyId = companies.length > 0 ? companies[0].id : '';
        const defaultCompanyName = companies.length > 0 ? companies[0].name : '';
        
        form.reset({
          name: '',
          email: '',
          phone: '',
          companyId: defaultCompanyId,
          companyName: defaultCompanyName,
        });
        
        setSelectedCompanyId(defaultCompanyId);
      }
    }
  }, [clientData, form, open, companies]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof clientFormSchema>) => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      console.log("Dados do formulário:", data);
      
      const companyInfo = companies.find(c => c.id === data.companyId);
      console.log("Empresa selecionada:", companyInfo);
      
      if (!data.companyId || data.companyId.trim() === '') {
        toast.error("Selecione uma empresa", { 
          description: "É necessário selecionar uma empresa para o cliente."
        });
        setSubmitting(false);
        return;
      }
      
      // Ensure companyName is set
      const companyName = companyInfo?.name || data.companyName || 'Empresa não encontrada';
      
      // Ensure the company exists in Supabase before proceeding
      const companyId = await ensureSupabaseCompanyExists({
        id: data.companyId,
        name: companyName
      });
      
      if (!companyId) {
        toast.error("Erro ao processar empresa", {
          description: "Não foi possível garantir que a empresa existe no banco de dados."
        });
        setSubmitting(false);
        return;
      }
      
      let success = false;
      
      if (isNew) {
        // Create new client with company name
        const newClient = await addClient({
          name: data.name,
          email: data.email,
          phone: data.phone,
          companyId: companyId,
          address: '',
          cnpj: '',
          companyName: companyName
        });
        
        if (newClient !== null) {
          console.log("Cliente criado:", newClient);
          toast.success('Cliente adicionado', { description: 'O cliente foi criado com sucesso.' });
          success = true;
        }
      } else if (clientData) {
        // Update existing client with company name
        const updated = await updateClient({
          ...clientData,
          name: data.name,
          email: data.email,
          phone: data.phone,
          companyId: companyId,
          companyName: companyName
        });
        
        if (updated === true) {
          console.log("Cliente atualizado:", updated);
          toast.success('Cliente atualizado', { description: 'O cliente foi atualizado com sucesso.' });
          success = true;
        }
      }
      
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar', { description: 'Não foi possível salvar os dados do cliente.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Novo Cliente' : 'Editar Cliente'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente" {...field} />
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
                    <Input placeholder="Email de contato" {...field} />
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
                    <Input placeholder="Telefone de contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Use the CompanySelector component */}
            <CompanySelector 
              form={form}
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
              required={true}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
