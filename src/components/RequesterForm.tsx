
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RequesterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const manualFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Telefone deve ter pelo menos 8 dígitos'),
  companyId: z.string().min(1, 'Empresa é obrigatória'),
  companyName: z.string().optional(),
});

const userFormSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
});

const RequesterForm: React.FC<RequesterFormProps> = ({ open, onOpenChange }) => {
  const { company, clients, addResponsible } = useCompany();
  const { users } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("manual");

  // Filter users that are not already registered as requesters
  const [availableUsers, setAvailableUsers] = useState<typeof users>([]);

  const manualForm = useForm<z.infer<typeof manualFormSchema>>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      companyId: company?.id || '',
      companyName: '',
    },
  });

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      userId: '',
    },
  });

  useEffect(() => {
    if (open) {
      manualForm.reset();
      userForm.reset();
      
      // Filter out users that are already registered as requesters
      const existingRequesterUserIds = users
        .filter(user => user.requesterIds && user.requesterIds.length > 0)
        .map(user => user.id);
      
      setAvailableUsers(users.filter(user => !existingRequesterUserIds.includes(user.id)));
    }
  }, [open, users, manualForm, userForm]);

  const onSubmitManual = async (values: z.infer<typeof manualFormSchema>) => {
    setIsLoading(true);
    try {
      const selectedCompany = company?.id === values.companyId 
        ? company 
        : clients.find(c => c.id === values.companyId);

      addResponsible({
        name: values.name,
        email: values.email,
        phone: values.phone,
        department: 'Solicitantes',
        role: 'Solicitante',
        type: 'requester', 
        companyName: selectedCompany?.name || values.companyName || '',
      });
      
      manualForm.reset();
      onOpenChange(false);
      toast.success("Solicitante adicionado com sucesso");
    } catch (error) {
      toast.error("Ocorreu um erro ao adicionar o solicitante");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitUser = async (values: z.infer<typeof userFormSchema>) => {
    setIsLoading(true);
    try {
      const selectedUser = users.find(user => user.id === values.userId);
      
      if (!selectedUser) {
        throw new Error("Usuário não encontrado");
      }

      addResponsible({
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone || '',
        department: selectedUser.department || 'Usuários',
        role: 'Usuário do Sistema',
        type: 'requester',
        userId: selectedUser.id,
        companyName: company?.name || '',
      });
      
      userForm.reset();
      onOpenChange(false);
      toast.success("Usuário adicionado como solicitante com sucesso");
    } catch (error) {
      toast.error("Ocorreu um erro ao adicionar o usuário como solicitante");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Solicitante</DialogTitle>
          <DialogDescription>
            Adicione um novo solicitante ao sistema. Solicitantes podem ser usuários do sistema ou pessoas externas.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
            <TabsTrigger value="user">Adicionar Usuário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <Form {...manualForm}>
              <form onSubmit={manualForm.handleSubmit(onSubmitManual)} className="space-y-4">
                <FormField
                  control={manualForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do solicitante" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={manualForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email do solicitante" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={manualForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Telefone do solicitante" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={manualForm.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {company && (
                            <SelectItem value={company.id}>{company.name}</SelectItem>
                          )}
                          {clients.map(client => (
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

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adicionando..." : "Adicionar Solicitante"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="user">
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
                <FormField
                  control={userForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adicionando..." : "Adicionar Usuário como Solicitante"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RequesterForm;
