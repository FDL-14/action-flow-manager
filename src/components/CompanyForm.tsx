
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
import { Upload, X } from 'lucide-react';

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Company | null;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  address: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CompanyForm: React.FC<CompanyFormProps> = ({ open, onOpenChange, initialData }) => {
  const { company, setCompany, updateCompanyLogo } = useCompany();
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
    const dataToUse = initialData || company;
    
    if (dataToUse) {
      form.reset({
        name: dataToUse.name,
        address: dataToUse.address || '',
        cnpj: dataToUse.cnpj || '',
        phone: dataToUse.phone || '',
      });
      
      if (dataToUse.logo) {
        setLogoPreview(dataToUse.logo);
      }
    }
  }, [initialData, company, form]);

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
      const dataToUpdate = initialData || company;
      
      if (!dataToUpdate) {
        // Create new company
        const newCompany = {
          id: '1',
          name: values.name,
          address: values.address,
          cnpj: values.cnpj,
          phone: values.phone,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setCompany(newCompany);
        
        if (logoPreview && logoFile) {
          updateCompanyLogo(logoPreview);
        }
      } else {
        // Update existing company
        const updatedCompany = {
          ...dataToUpdate,
          name: values.name,
          address: values.address,
          cnpj: values.cnpj,
          phone: values.phone,
          updatedAt: new Date(),
        };
        
        setCompany(updatedCompany);
        
        if (logoPreview !== dataToUpdate.logo) {
          if (logoPreview) {
            updateCompanyLogo(logoPreview);
          } else {
            // Remove logo
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
        title: "Empresa atualizada",
        description: "As informações da empresa foram atualizadas com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a empresa",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Empresa</DialogTitle>
          <DialogDescription>
            Configure as informações da sua empresa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <FormLabel>Logo da Empresa</FormLabel>
                <div className="mt-2 flex flex-col items-center">
                  {logoPreview ? (
                    <div className="relative w-40 h-40 mb-4">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6"
                        onClick={removeLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-md p-8 mb-4 flex flex-col items-center justify-center">
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Nenhuma logo selecionada</p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    id="logo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  <label htmlFor="logo-upload">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar logo
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Minha Empresa Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: (00) 0000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Empresa</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyForm;
