
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/contexts/CompanyContext';
import { Company } from '@/lib/types';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import CompanyFormFields from './company/CompanyFormFields';
import LogoUpload from './company/LogoUpload';

// Define the form schema with validation
const companyFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome da empresa deve ter no mínimo 2 caracteres' }),
  cnpj: z.string().optional(),
  inscriptionType: z.enum(['CNPJ', 'CPF', 'CAEPF', 'CNO']).default('CNPJ'),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.string().optional(),
});

export interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Company | null;
  isNewCompany: boolean;
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  open,
  onOpenChange,
  initialData,
  isNewCompany
}) => {
  const { addCompany, updateCompany } = useCompany();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Initialize the form with the schema
  const form = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      cnpj: initialData?.cnpj || '',
      inscriptionType: 'CNPJ',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      logo: initialData?.logo || '',
    },
  });

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        cnpj: initialData.cnpj || '',
        inscriptionType: 'CNPJ', // Default value, you might need to extract this from CNPJ field
        address: initialData.address || '',
        phone: initialData.phone || '',
        logo: initialData.logo || '',
      });
      setLogoPreview(initialData.logo || null);
    } else {
      form.reset({
        name: '',
        cnpj: '',
        inscriptionType: 'CNPJ',
        address: '',
        phone: '',
        logo: '',
      });
      setLogoPreview(null);
    }
  }, [initialData, form]);

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(initialData?.logo || null);
    }
  };

  const onSubmit = async (data: z.infer<typeof companyFormSchema>) => {
    try {
      // Handle logo upload if there's a new file
      let logoUrl = data.logo;
      if (logoFile) {
        // This would be replaced with your actual file upload logic
        logoUrl = logoPreview || '';
      }

      const companyData = {
        ...data,
        logo: logoUrl,
      };

      if (isNewCompany) {
        await addCompany({
          name: companyData.name,
          cnpj: companyData.cnpj,
          address: companyData.address,
          phone: companyData.phone,
          logo: companyData.logo,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success('Empresa adicionada', { description: 'A empresa foi criada com sucesso.' });
      } else if (initialData) {
        await updateCompany({
          ...initialData,
          name: companyData.name,
          cnpj: companyData.cnpj,
          address: companyData.address,
          phone: companyData.phone,
          logo: companyData.logo,
        });
        toast.success('Empresa atualizada', { description: 'Os dados da empresa foram atualizados.' });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar', { description: 'Não foi possível salvar os dados da empresa.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isNewCompany ? 'Nova Empresa' : 'Editar Empresa'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/3">
                <CompanyFormFields form={form} />
              </div>
              <div className="w-full md:w-1/3">
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormControl>
                        <LogoUpload
                          logoPreview={logoPreview}
                          onLogoChange={handleLogoChange}
                          onRemoveLogo={() => {
                            setLogoPreview(null);
                            setLogoFile(null);
                            field.onChange('');
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

export default CompanyForm;
