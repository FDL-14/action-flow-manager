
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/contexts/CompanyContext';
import { Company } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCompany?: Company | null;
}

const CompanyForm = ({ open, onOpenChange, editCompany }: CompanyFormProps) => {
  const { addCompany, updateCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [registrationType, setRegistrationType] = useState<string>('CNPJ');
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      address: '',
      registrationNumber: '',
      phone: '',
      logo: ''
    }
  });

  useEffect(() => {
    if (editCompany) {
      setValue('name', editCompany.name);
      setValue('address', editCompany.address || '');
      setValue('registrationNumber', editCompany.cnpj || '');
      setValue('phone', editCompany.phone || '');
      setValue('logo', editCompany.logo || '');
      // If editing, try to determine registration type from existing data
      if (editCompany.cnpj) {
        if (editCompany.cnpj.length === 14) setRegistrationType('CNPJ');
        else if (editCompany.cnpj.length === 11) setRegistrationType('CPF');
        else if (editCompany.cnpj.length === 12) setRegistrationType('CAEPF');
        else if (editCompany.cnpj.length === 13) setRegistrationType('CNO');
        else setRegistrationType('CNPJ');
      }
    } else {
      reset({
        name: '',
        address: '',
        registrationNumber: '',
        phone: '',
        logo: ''
      });
      setRegistrationType('CNPJ');
    }
  }, [editCompany, setValue, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    
    try {
      const companyData = {
        name: data.name,
        address: data.address,
        cnpj: data.registrationNumber,
        phone: data.phone,
        logo: data.logo,
      };

      if (editCompany) {
        await updateCompany({
          ...companyData,
          id: editCompany.id,
          createdAt: editCompany.createdAt,
          updatedAt: new Date()
        });
        toast.success('Empresa atualizada com sucesso');
      } else {
        await addCompany({
          ...companyData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Empresa cadastrada com sucesso');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar empresa. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
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
              <Label>Tipo de Inscrição CNPJ/CPF/CAEPF/CNO</Label>
              <Select value={registrationType} onValueChange={setRegistrationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CAEPF">CAEPF</SelectItem>
                  <SelectItem value="CNO">CNO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="registrationNumber">Número da Inscrição {registrationType}</Label>
              <Input
                id="registrationNumber"
                {...register('registrationNumber')}
                placeholder={`Digite o ${registrationType}`}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                {...register('address')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="logo">URL do Logo</Label>
              <Input
                id="logo"
                type="url"
                {...register('logo')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyForm;
