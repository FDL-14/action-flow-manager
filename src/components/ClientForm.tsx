import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { Client } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClient?: Client;
}

const ClientForm = ({ open, onOpenChange, editClient }: ClientFormProps) => {
  const { user } = useAuth();
  const { addClient, updateClient, companies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    }
  });

  // Filter companies based on user's permissions
  useEffect(() => {
    if (user) {
      // If user is master or has permission to manage all companies, show all companies
      if (user.role === 'master' || user.permissions.some(p => p.canEditCompany)) {
        setAvailableCompanies(companies);
      } else {
        // Otherwise, filter companies user has access to
        const userCompanies = companies.filter(company => 
          user.companyIds.includes(company.id)
        );
        setAvailableCompanies(userCompanies);
      }
    }
  }, [user, companies]);

  useEffect(() => {
    if (editClient) {
      setValue('name', editClient.name);
      setValue('email', editClient.email || '');
      setValue('phone', editClient.phone || '');
      setSelectedCompanyId(editClient.companyId);
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
      });
      
      // Set default company if user only has access to one company
      if (availableCompanies.length === 1) {
        setSelectedCompanyId(availableCompanies[0].id);
      } else if (user?.companyIds?.length === 1) {
        setSelectedCompanyId(user.companyIds[0]);
      } else {
        setSelectedCompanyId('');
      }
    }
  }, [editClient, setValue, reset, availableCompanies, user]);

  const onSubmit = async (data: any) => {
    if (!selectedCompanyId) {
      toast.error("É necessário selecionar uma empresa");
      return;
    }

    setLoading(true);
    
    try {
      const clientData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyId: selectedCompanyId,
      };

      if (editClient) {
        await updateClient({
          ...clientData,
          id: editClient.id,
          createdAt: editClient.createdAt,
          updatedAt: new Date()
        });
        toast.success('Cliente atualizado com sucesso');
      } else {
        await addClient({
          ...clientData
        });
        toast.success('Cliente cadastrado com sucesso');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                {...register('name', { required: 'Nome é obrigatório' })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">Empresa</Label>
              <Select 
                value={selectedCompanyId} 
                onValueChange={setSelectedCompanyId}
                disabled={editClient && !user?.permissions.some(p => p.canEditClient)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedCompanyId && (
                <p className="text-sm text-amber-500">É necessário selecionar uma empresa</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || !selectedCompanyId}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
