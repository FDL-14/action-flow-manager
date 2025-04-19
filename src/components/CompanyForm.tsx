
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/contexts/CompanyContext';
import { Company } from '@/lib/types';
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
import { useToast } from '@/hooks/use-toast';
import LogoUpload from './company/LogoUpload';
import CompanyFormFields from './company/CompanyFormFields';

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Company | null;
  isNewCompany?: boolean;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  address: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CompanyForm: React.FC<CompanyFormProps> = ({ 
  open, 
  onOpenChange, 
  initialData, 
  isNewCompany = false 
}) => {
  const { company, setCompany, updateCompanyLogo, addCompany, updateCompany } = useCompany();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      cnpj: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        name: '',
        address: '',
        cnpj: '',
        phone: '',
      });
      setLogoPreview(null);
      setLogoFile(null);
      return;
    }
    
    const dataToUse = initialData || (isNewCompany ? null : company);
    
    if (dataToUse) {
      // Ensure name is always a string, never undefined
      const companyName = dataToUse.name || '';
      
      form.reset({
        name: companyName,
        address: dataToUse.address || '',
        cnpj: dataToUse.cnpj || '',
        phone: dataToUse.phone || '',
      });
      
      if (dataToUse.logo) {
        setLogoPreview(dataToUse.logo);
      } else {
        setLogoPreview(null);
      }
    } else {
      form.reset({
        name: '',
        address: '',
        cnpj: '',
        phone: '',
      });
      setLogoPreview(null);
    }
  }, [initialData, company, form, isNewCompany, open]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = (values: FormValues) => {
    try {
      if (isNewCompany) {
        const newCompany: Omit<Company, 'id'> = {
          name: values.name,
          address: values.address,
          cnpj: values.cnpj,
          phone: values.phone,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        if (logoPreview) {
          newCompany.logo = logoPreview;
        }
        
        addCompany(newCompany);
      } else if (initialData) {
        const updatedCompany = {
          ...initialData,
          name: values.name,
          address: values.address,
          cnpj: values.cnpj,
          phone: values.phone,
          logo: logoPreview || undefined,
          updatedAt: new Date(),
        };
        
        updateCompany(updatedCompany);
      } else {
        const updatedCompany = {
          ...company!,
          name: values.name,
          address: values.address,
          cnpj: values.cnpj,
          phone: values.phone,
          updatedAt: new Date(),
        };
        
        setCompany(updatedCompany);
        
        if (logoPreview !== company?.logo) {
          if (logoPreview) {
            updateCompanyLogo(logoPreview);
          } else {
            const companyWithoutLogo = {
              ...updatedCompany,
              logo: undefined,
            };
            setCompany(companyWithoutLogo);
          }
        }
      }
      
      onOpenChange(false);
      
      toast({
        title: isNewCompany ? "Empresa criada" : "Empresa atualizada",
        description: isNewCompany 
          ? "A nova empresa foi criada com sucesso!" 
          : "As informações da empresa foram atualizadas com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao ${isNewCompany ? 'criar' : 'atualizar'} a empresa`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNewCompany ? 'Nova Empresa' : 'Configurar Empresa'}</DialogTitle>
          <DialogDescription>
            {isNewCompany ? 'Preencha os dados para criar uma nova empresa.' : 'Configure as informações da empresa.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <LogoUpload
                logoPreview={logoPreview}
                onLogoChange={handleLogoChange}
                onRemoveLogo={removeLogo}
              />
              <CompanyFormFields form={form} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{isNewCompany ? 'Criar Empresa' : 'Salvar Empresa'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyForm;
