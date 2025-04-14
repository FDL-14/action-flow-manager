
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
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const CompanyForm: React.FC<CompanyFormProps> = ({ open, onOpenChange, initialData, isNewCompany = false }) => {
  const { company, setCompany, updateCompanyLogo } = useCompany();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast: toastUI } = useToast();

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
    const dataToUse = initialData || (isNewCompany ? null : company);
    
    if (dataToUse) {
      form.reset({
        name: dataToUse.name,
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
  }, [initialData, company, form, isNewCompany]);

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

  const uploadLogo = async (file: File): Promise<string | undefined> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `companies/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Erro ao fazer upload do logo:', uploadError);
        toast.error('Não foi possível fazer upload do logo');
        return undefined;
      }
      
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Erro durante upload do logo:', error);
      toast.error('Erro durante upload do logo');
      return undefined;
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Upload do logo, se houver
      let logoUrl = logoPreview;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      if (isNewCompany) {
        // Criar nova empresa
        const newCompany = {
          name: values.name,
          address: values.address,
          cnpj: values.cnpj,
          phone: values.phone,
          logo: logoUrl,
        };
        
        const { data, error } = await supabase
          .from('companies')
          .insert(newCompany)
          .select('*')
          .single();
        
        if (error) {
          console.error('Erro ao criar empresa:', error);
          toast.error('Não foi possível criar a empresa');
          return;
        }
        
        const formattedCompany: Company = {
          id: data.id,
          name: data.name,
          address: data.address || '',
          cnpj: data.cnpj || '',
          phone: data.phone || '',
          logo: data.logo || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
        
        toast.success('Empresa criada com sucesso!');
        
        // Se for a primeira empresa, defina como principal
        if (!company) {
          setCompany(formattedCompany);
        }
      } else if (initialData) {
        // Atualizar empresa existente
        const updatedCompany = {
          name: values.name,
          address: values.address,
          cnpj: values.cnpj,
          phone: values.phone,
          logo: logoUrl,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('companies')
          .update(updatedCompany)
          .eq('id', initialData.id);
        
        if (error) {
          console.error('Erro ao atualizar empresa:', error);
          toast.error('Não foi possível atualizar a empresa');
          return;
        }
        
        // Se for a empresa principal, atualiza no contexto
        if (company && company.id === initialData.id) {
          setCompany({
            ...company,
            name: values.name,
            address: values.address,
            cnpj: values.cnpj,
            phone: values.phone,
            logo: logoUrl,
            updatedAt: new Date()
          });
        }
        
        toast.success('Empresa atualizada com sucesso!');
      }
      
      onOpenChange(false);
      
      // Recarregar a página para mostrar as mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toastUI({
        title: "Erro",
        description: `Ocorreu um erro ao ${isNewCompany ? 'criar' : 'atualizar'} a empresa`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isNewCompany ? 'Criando...' : 'Salvando...'}
                  </>
                ) : (
                  isNewCompany ? 'Criar Empresa' : 'Salvar Empresa'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyForm;
