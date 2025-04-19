
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ActionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  companyId: z.string().min(1, 'Selecione uma empresa'),
  responsibleId: z.string().min(1, 'Selecione um responsável'),
  clientId: z.string().optional(),
  requesterId: z.string().min(1, 'Selecione um solicitante'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de término é obrigatória'),
});

type FormValues = z.infer<typeof formSchema>;

const ActionForm: React.FC<ActionFormProps> = ({ open, onOpenChange }) => {
  const { companies, responsibles, clients, company: defaultCompany } = useCompany();
  const { addAction } = useActions();
  const { user, users } = useAuth();
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filteredClients, setFilteredClients] = useState(clients);
  const [filteredRequesters, setFilteredRequesters] = useState<Array<{ id: string; name: string; email?: string; type?: string }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(defaultCompany?.id || '');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      description: '',
      companyId: defaultCompany?.id || '',
      responsibleId: '',
      clientId: '',
      requesterId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  useEffect(() => {
    const allRequesters = [...responsibles.filter(resp => 
      resp.type === 'requester' || resp.role === 'Solicitante' || !resp.type
    )];
    
    users.forEach(user => {
      const alreadyIncluded = allRequesters.some(req => 
        (req.userId && req.userId === user.id) || req.email === user.email
      );
      
      if (!alreadyIncluded) {
        allRequesters.push({
          id: user.id,
          name: user.name,
          email: user.email,
          department: "User Department",
          role: "User",
          type: "requester",
          companyId: selectedCompanyId || defaultCompany?.id || "",
          createdAt: new Date(),
          updatedAt: new Date(),
          isSystemUser: true
        });
      }
    });
    
    if (selectedCompanyId) {
      setFilteredClients(clients.filter(client => client.companyId === selectedCompanyId));
      
      const companyRequesters = allRequesters.filter(
        resp => !resp.companyId || 
          resp.companyId === selectedCompanyId || 
          (resp.clientIds && resp.clientIds.some(id => 
            clients.some(c => c.id === id && c.companyId === selectedCompanyId)
          ))
      );
      
      setFilteredRequesters(companyRequesters);
    } else {
      setFilteredClients(clients);
      setFilteredRequesters(allRequesters);
    }
    
    console.log('All possible requesters:', allRequesters);
  }, [selectedCompanyId, clients, responsibles, users, defaultCompany]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      const newAttachments = newFiles.map(file => 
        URL.createObjectURL(file)
      );
      
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    const newAttachments = [...attachments];
    
    URL.revokeObjectURL(newAttachments[index]);
    
    newFiles.splice(index, 1);
    newAttachments.splice(index, 1);
    
    setUploadedFiles(newFiles);
    setAttachments(newAttachments);
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Submitting form with values:', values);
      console.log('Uploaded files:', uploadedFiles);
      
      const uploadedAttachments: string[] = [];
      
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `temp/${fileName}`;
            
            const { data, error } = await supabase
              .storage
              .from('action_attachments')
              .upload(filePath, file);
              
            if (error) {
              console.error('Error uploading file:', error);
              throw error;
            }
            
            uploadedAttachments.push(filePath);
          } catch (error) {
            console.error('Error uploading attachment:', error);
          }
        }
      }
      
      await addAction({
        subject: values.subject,
        description: values.description,
        responsibleId: values.responsibleId,
        companyId: values.companyId,
        clientId: values.clientId || undefined,
        requesterId: values.requesterId,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        attachments: uploadedAttachments,
        createdBy: user.id,
        createdByName: user.name
      });

      form.reset();
      setAttachments([]);
      setUploadedFiles([]);
      onOpenChange(false);
      
      toast({
        title: "Ação criada",
        description: "A ação foi criada com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving action:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a ação",
        variant: "destructive",
      });
    }
  };

  // This is the key change - use responsibles for the Responsável dropdown
  // instead of filtering only for current company users
  const getResponsibles = () => {
    if (!selectedCompanyId) return [];
    return responsibles.filter(resp => resp.companyId === selectedCompanyId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ação</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da nova ação ou tarefa a ser executada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Fazer orçamento Ipê Shopping" {...field} />
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCompanyId(value);
                      form.setValue('clientId', '');
                      form.setValue('responsibleId', '');
                      form.setValue('requesterId', '');
                    }} 
                    defaultValue={field.value}
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
            
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsibleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getResponsibles().map((responsible) => (
                        <SelectItem key={responsible.id} value={responsible.id}>
                          {responsible.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requesterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solicitante</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o solicitante" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredRequesters.map((requester) => (
                        <SelectItem key={requester.id} value={requester.id}>
                          {requester.name} {requester.type === 'user' ? '(Usuário)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a ação em detalhes..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Término</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Anexos</FormLabel>
              <div className="mt-2 border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors duration-150">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.pdf,.docx,.xlsx,.doc,.xls"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Upload className="h-6 w-6 text-gray-400 mb-1" />
                    <p className="text-sm text-gray-500">
                      Enviar arquivos ou arraste e solte
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, PDF, DOCX and XLSX
                    </p>
                  </div>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Ação</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionForm;
