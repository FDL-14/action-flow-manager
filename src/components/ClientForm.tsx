
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Define form schema with validation
const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter no mínimo 2 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  companyId: z.string({ required_error: "Selecione uma empresa" })
    .min(1, { message: 'Selecione uma empresa' }),
});

export interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Client | null;
  isNewClient: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({
  open,
  onOpenChange,
  initialData,
  isNewClient
}) => {
  const { addClient, updateClient, companies } = useCompany();
  
  // Initialize form with schema
  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      companyId: initialData?.companyId || '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email || '',
        phone: initialData.phone || '',
        companyId: initialData.companyId || '',
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        companyId: '',
      });
    }
  }, [initialData, form, open]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof clientFormSchema>) => {
    try {
      console.log("Form data:", data); // Debug log
      
      if (isNewClient) {
        await addClient({
          name: data.name,
          email: data.email,
          phone: data.phone,
          companyId: data.companyId,
          address: '',
          cnpj: ''
        });
        toast.success('Cliente adicionado', { description: 'O cliente foi criado com sucesso.' });
      } else if (initialData) {
        await updateClient({
          ...initialData,
          name: data.name,
          email: data.email,
          phone: data.phone,
          companyId: data.companyId,
        });
        toast.success('Cliente atualizado', { description: 'O cliente foi atualizado com sucesso.' });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar', { description: 'Não foi possível salvar os dados do cliente.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNewClient ? 'Novo Cliente' : 'Editar Cliente'}</DialogTitle>
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

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
