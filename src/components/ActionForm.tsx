
import { useState, useEffect, useCallback } from 'react';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { syncLocalCompaniesToSupabase } from '@/hooks/client/supabase/company-operations';
import { syncResponsiblesToSupabase } from '@/hooks/client/supabase/responsible-operations';
import { Spinner } from '@/components/ui/spinner';

interface ActionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
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

const ActionForm: React.FC<ActionFormProps> = ({ open, onOpenChange, initialData }) => {
  const { companies, responsibles, clients, company: defaultCompany, getClientsByCompanyId } = useCompany();
  const { addAction, updateAction } = useActions();
  const { user, users } = useAuth();
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filteredClients, setFilteredClients] = useState(clients);
  const [filteredRequesters, setFilteredRequesters] = useState<
    Array<{ id: string; name: string; email?: string; type?: string; isUser?: boolean }>
  >([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(defaultCompany?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: initialData?.subject || '',
      description: initialData?.description || '',
      companyId: initialData?.companyId || defaultCompany?.id || '',
      responsibleId: initialData?.responsibleId || '',
      clientId: initialData?.clientId || '',
      requesterId: initialData?.requesterId || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
    },
  });

  // Reset form when opening with initial data
  useEffect(() => {
    if (open) {
      setIsEditing(!!initialData);
      form.reset({
        subject: initialData?.subject || '',
        description: initialData?.description || '',
        companyId: initialData?.companyId || defaultCompany?.id || '',
        responsibleId: initialData?.responsibleId || '',
        clientId: initialData?.clientId || '',
        requesterId: initialData?.requesterId || '',
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
      });
      
      if (initialData?.companyId) {
        setSelectedCompanyId(initialData.companyId);
      } else if (defaultCompany?.id) {
        setSelectedCompanyId(defaultCompany.id);
      }
    }
  }, [open, initialData, defaultCompany, form]);

  // Synchronize data with Supabase when the form is opened
  useEffect(() => {
    if (open && (companies.length > 0 || responsibles.length > 0)) {
      const syncData = async () => {
        try {
          setSyncingData(true);
          console.log("Iniciando sincronização de dados com o Supabase...");
          
          // Sync companies first
          console.log(`Sincronizando ${companies.length} empresas com o Supabase...`);
          await syncLocalCompaniesToSupabase(companies);
          
          // Then sync responsibles
          console.log(`Sincronizando ${responsibles.length} responsáveis com o Supabase...`);
          await syncResponsiblesToSupabase(responsibles);
          
          console.log("Sincronização concluída com sucesso");
          setSyncingData(false);
        } catch (error) {
          console.error('Erro ao sincronizar dados:', error);
          setSyncingData(false);
          toast.error("Erro de sincronização", {
            description: "Não foi possível sincronizar os dados com o banco de dados."
          });
        }
      };
      
      syncData();
    }
  }, [open, companies, responsibles]);

  // Update filtered clients when company selection changes
  useEffect(() => {
    if (selectedCompanyId) {
      const companyClients = getClientsByCompanyId(selectedCompanyId);
      console.log(`Atualizando clientes para empresa ${selectedCompanyId}:`, companyClients);
      setFilteredClients(companyClients);
    } else {
      setFilteredClients(clients);
    }
  }, [selectedCompanyId, clients, getClientsByCompanyId]);

  // Update filtered requesters (responsibles + users)
  useEffect(() => {
    const getCombinedResponsiblesAndUsers = () => {
      // Start with responsibles for the selected company
      const responsiblesList = responsibles
        .filter(r => !selectedCompanyId || r.companyId === selectedCompanyId)
        .map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          type: "responsible",
          isUser: false,
        }));

      // Add users that aren't already in the responsibles list
      const responsibleIds = new Set(responsiblesList.map(r => r.id));
      const usersList = users
        .filter(u => !responsibleIds.has(u.id))
        .map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          type: "user",
          isUser: true,
        }));

      return [...responsiblesList, ...usersList];
    };

    setFilteredRequesters(getCombinedResponsiblesAndUsers());
  }, [selectedCompanyId, responsibles, users]);

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
    if (submitting || syncingData) return;
    setSubmitting(true);
    
    try {
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      console.log('Submitting form with values:', values);
      
      if (!values.companyId || values.companyId.trim() === '') {
        toast({
          title: "Erro",
          description: "Selecione uma empresa",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Create a copy of the values to avoid modifying the form data directly
      const actionData = { ...values };
      
      // Ensure the company exists in Supabase
      const companyInfo = companies.find(c => c.id === values.companyId);
      console.log('Empresa selecionada:', companyInfo);
      
      // Ensure the company exists in Supabase
      const companyId = await syncLocalCompaniesToSupabase([{
        id: values.companyId,
        name: companyInfo?.name || 'Empresa'
      }]);
      
      if (!companyId || companyId.length === 0) {
        toast({
          title: "Erro",
          description: "Não foi possível garantir que a empresa existe no banco de dados",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Get responsible and requester information
      const responsible = responsibles.find(r => r.id === values.responsibleId);
      const requesterResponsible = responsibles.find(r => r.id === values.requesterId);
      const requesterUser = users.find(u => u.id === values.requesterId);
      
      // Ensure the responsible exists in Supabase
      if (responsible) {
        await syncResponsiblesToSupabase([responsible]);
      } else {
        console.warn(`Responsável com ID ${values.responsibleId} não encontrado na lista local`);
      }
      
      // Ensure the requester exists if it's a responsible
      if (requesterResponsible) {
        await syncResponsiblesToSupabase([requesterResponsible]);
      }
      
      const uploadedAttachments: string[] = [];
      
      // Handle file uploads
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `action_attachments/${fileName}`;
            
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
      
      const startDate = new Date(values.startDate);
      const endDate = new Date(values.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Datas inválidas");
      }
      
      // Create or update the action
      if (isEditing && initialData) {
        // Update existing action
        await updateAction({
          ...initialData,
          subject: values.subject,
          description: values.description,
          responsibleId: values.responsibleId,
          responsibleName: responsible?.name,
          companyId: values.companyId,
          companyName: companyInfo?.name,
          clientId: values.clientId || undefined,
          clientName: values.clientId ? filteredClients.find(c => c.id === values.clientId)?.name : undefined,
          requesterId: values.requesterId,
          requesterName: requesterResponsible?.name || requesterUser?.name,
          startDate,
          endDate,
          attachments: [...(initialData.attachments || []), ...uploadedAttachments],
          updatedAt: new Date()
        });
        
        toast.success("Ação atualizada com sucesso!");
      } else {
        // Create new action
        await addAction({
          subject: values.subject,
          description: values.description,
          responsibleId: values.responsibleId,
          responsibleName: responsible?.name,
          companyId: values.companyId,
          companyName: companyInfo?.name,
          clientId: values.clientId || undefined,
          clientName: values.clientId ? filteredClients.find(c => c.id === values.clientId)?.name : undefined,
          requesterId: values.requesterId,
          requesterName: requesterResponsible?.name || requesterUser?.name,
          startDate,
          endDate,
          attachments: uploadedAttachments,
          createdBy: user.id,
          createdByName: user.name
        });
        
        toast.success("Ação criada com sucesso!");
      }

      form.reset();
      setAttachments([]);
      setUploadedFiles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving action:', error);
      toast.error("Erro ao salvar ação", {
        description: error.message || "Ocorreu um erro ao salvar a ação"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Ação' : 'Nova Ação'}</DialogTitle>
          <DialogDescription>
            {syncingData ? (
              <div className="flex items-center gap-2 text-amber-500">
                <Spinner size="sm" /> Sincronizando dados com o banco...
              </div>
            ) : (
              'Preencha os detalhes da ação a ser executada.'
            )}
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
                    }} 
                    defaultValue={field.value}
                    disabled={syncingData}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={syncingData ? "Sincronizando empresas..." : "Selecione uma empresa"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {companies.length === 0 ? (
                        <SelectItem value="no_companies" disabled>
                          Nenhuma empresa cadastrada
                        </SelectItem>
                      ) : (
                        companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))
                      )}
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
                    onValueChange={(value) => {
                      field.onChange(value);
                    }} 
                    defaultValue={field.value}
                    disabled={!selectedCompanyId || syncingData}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={
                          !selectedCompanyId 
                            ? "Selecione uma empresa primeiro"
                            : filteredClients.length > 0 
                              ? "Selecione um cliente" 
                              : "Nenhum cliente disponível para esta empresa"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="">-- Nenhum cliente --</SelectItem>
                      {filteredClients.length === 0 ? (
                        <SelectItem value="no_clients_available" disabled>
                          Nenhum cliente disponível
                        </SelectItem>
                      ) : (
                        filteredClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedCompanyId && filteredClients.length === 0 && (
                    <div className="mt-2 text-sm text-orange-500">
                      Esta empresa não possui clientes. Adicione clientes na página de Clientes.
                    </div>
                  )}
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
                    disabled={syncingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredRequesters.filter(person => person.type === "responsible").length === 0 ? (
                        <SelectItem value="no_responsibles" disabled>
                          Nenhum responsável disponível
                        </SelectItem>
                      ) : (
                        filteredRequesters
                          .filter(person => person.type === "responsible")
                          .map(person => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))
                      )}
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
                    disabled={syncingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o solicitante" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredRequesters.length === 0 ? (
                        <SelectItem value="no_requesters" disabled>
                          Nenhum solicitante disponível
                        </SelectItem>
                      ) : (
                        filteredRequesters.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name} {person.type === "user" ? "(Usuário)" : "(Responsável)"}
                          </SelectItem>
                        ))
                      )}
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
              <div className="border border-dashed rounded-md p-4 mt-1">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">Clique para adicionar arquivos</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Arquivos anexados:</p>
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm truncate">
                        {uploadedFiles[index].name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={submitting || syncingData}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={submitting || syncingData}
              >
                {submitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionForm;
