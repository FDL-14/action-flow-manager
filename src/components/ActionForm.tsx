
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import ActionFormWrapper from "./ActionFormWrapper";

interface ActionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  subject: z.string().min(3, {
    message: "Assunto deve ter pelo menos 3 caracteres.",
  }),
  description: z.string().optional(),
  responsibleId: z.string({
    required_error: "Por favor selecione um responsável.",
  }),
  clientId: z.string().optional(),
  requesterId: z.string().optional(),
  endDate: z.date({
    required_error: "Por favor selecione uma data de conclusão.",
  }),
});

const ActionForm: React.FC<ActionFormProps> = ({ open, onOpenChange }) => {
  const { company } = useCompany();
  const { addAction } = useActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responsibles, setResponsibles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [requesters, setRequesters] = useState<any[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      description: "",
      endDate: new Date(),
    },
  });

  useEffect(() => {
    // Reset form when dialog opens/closes
    if (!open) {
      setTimeout(() => form.reset(), 300);
    }
  }, [open, form]);

  useEffect(() => {
    const fetchResponsibles = async () => {
      try {
        // Simulate fetching responsibles
        setResponsibles([
          { id: '12345678-1234-1234-1234-123456789012', name: 'Responsável 1' },
          { id: '87654321-4321-4321-4321-210987654321', name: 'Responsável 2' },
          // Add more mock responsibles as needed
        ]);
      } catch (error) {
        console.error('Erro ao buscar responsáveis:', error);
      }
    };

    const fetchClients = async () => {
      try {
        // Simulate fetching clients
        setClients([
          { id: '11111111-1111-1111-1111-111111111111', name: 'Cliente 1' },
          { id: '22222222-2222-2222-2222-222222222222', name: 'Cliente 2' },
          // Add more mock clients as needed
        ]);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    };

    const fetchRequesters = async () => {
      try {
        // Simulate fetching requesters
        setRequesters([
          { id: '33333333-3333-3333-3333-333333333333', name: 'Solicitante 1' },
          { id: '44444444-4444-4444-4444-444444444444', name: 'Solicitante 2' },
          // Add more mock requesters as needed
        ]);
      } catch (error) {
        console.error('Erro ao buscar solicitantes:', error);
      }
    };

    if (open) {
      fetchResponsibles();
      fetchClients();
      fetchRequesters();
    }
  }, [open]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!company?.id) {
      toast.error("Erro", {
        description: "É necessário selecionar uma empresa"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addAction({
        subject: data.subject,
        description: data.description || "",
        responsibleId: data.responsibleId,
        clientId: data.clientId,
        requesterId: data.requesterId,
        startDate: new Date(),
        endDate: data.endDate,
        companyId: company.id,
      });
      
      toast.success("Sucesso", {
        description: "Ação criada com sucesso!"
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao criar ação:", error);
      toast.error("Erro", {
        description: error.message || "Ocorreu um erro ao criar a ação."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ActionFormWrapper />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Ação</DialogTitle>
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
                      <Input placeholder="Digite o assunto da ação" {...field} />
                    </FormControl>
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
                      <Textarea placeholder="Digite uma descrição detalhada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="responsibleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {responsibles.map(responsible => (
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
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {requesters.map(requester => (
                            <SelectItem key={requester.id} value={requester.id}>
                              {requester.name}
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
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de conclusão</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Criar Ação'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActionForm;
