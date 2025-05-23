
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useActions } from '@/contexts/ActionContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Action, PersonalReminderSettings } from '@/lib/types';

interface ActionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: Action;
  isPersonal?: boolean;
}

const ActionForm: React.FC<ActionFormProps> = ({ 
  open, 
  onOpenChange, 
  action,
  isPersonal = false 
}) => {
  const { addAction, updateAction } = useActions();
  const { companies, clients, responsibles } = useCompany();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    responsibleId: '',
    requesterId: '',
    companyId: '',
    clientId: '',
    startDate: new Date(),
    endDate: new Date(),
    approvalRequired: false,
    approverId: '',
    isPersonal: isPersonal,
    personalReminderSettings: {
      reminderBeforeHours: 24,
      reminderFrequencyHours: 1,
      emailEnabled: true,
      whatsappEnabled: false,
      smsEnabled: false,
      internalEnabled: true
    } as PersonalReminderSettings
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (action) {
      setFormData({
        subject: action.subject,
        description: action.description,
        responsibleId: action.responsibleId,
        requesterId: action.requesterId || '',
        companyId: action.companyId,
        clientId: action.clientId || '',
        startDate: action.startDate,
        endDate: action.endDate,
        approvalRequired: action.approvalRequired || false,
        approverId: action.approverId || '',
        isPersonal: action.isPersonal || false,
        personalReminderSettings: action.personalReminderSettings || {
          reminderBeforeHours: 24,
          reminderFrequencyHours: 1,
          emailEnabled: true,
          whatsappEnabled: false,
          smsEnabled: false,
          internalEnabled: true
        }
      });
    } else {
      setFormData({
        subject: '',
        description: '',
        responsibleId: isPersonal ? (user?.id || '') : '',
        requesterId: isPersonal ? (user?.id || '') : '',
        companyId: '',
        clientId: '',
        startDate: new Date(),
        endDate: new Date(),
        approvalRequired: false,
        approverId: '',
        isPersonal: isPersonal,
        personalReminderSettings: {
          reminderBeforeHours: 24,
          reminderFrequencyHours: 1,
          emailEnabled: true,
          whatsappEnabled: false,
          smsEnabled: false,
          internalEnabled: true
        }
      });
    }
  }, [action, isPersonal, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast.error('O assunto é obrigatório');
      return;
    }

    if (!isPersonal) {
      if (!formData.responsibleId) {
        toast.error('O responsável é obrigatório');
        return;
      }

      if (!formData.companyId) {
        toast.error('A empresa é obrigatória');
        return;
      }
    }

    setLoading(true);
    try {
      const actionData = {
        subject: formData.subject,
        description: formData.description,
        responsibleId: formData.responsibleId,
        requesterId: formData.requesterId,
        companyId: formData.companyId,
        clientId: formData.clientId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        approvalRequired: formData.approvalRequired,
        approverId: formData.approverId,
        isPersonal: formData.isPersonal,
        personalReminderSettings: formData.personalReminderSettings
      };

      if (action) {
        await updateAction(action.id, actionData);
        toast.success('Ação/Tarefa atualizada com sucesso!');
      } else {
        await addAction(actionData);
        toast.success(isPersonal ? 'Lembrete pessoal criado com sucesso!' : 'Ação/Tarefa criada com sucesso!');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar ação:', error);
      toast.error('Erro ao salvar ação/tarefa');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar responsáveis por empresa/cliente selecionado
  const availableResponsibles = responsibles.filter(resp => {
    if (formData.companyId && resp.companyId !== formData.companyId) {
      return false;
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {action ? 'Editar' : 'Nova'} {isPersonal ? 'Lembrete Pessoal' : 'Ação/Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Digite o assunto da ação/tarefa"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite a descrição"
              rows={3}
            />
          </div>

          {!isPersonal && (
            <>
              <div>
                <Label htmlFor="company">Empresa *</Label>
                <Select
                  value={formData.companyId}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    companyId: value,
                    clientId: '' // Reset client when company changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                  disabled={!formData.companyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients
                      .filter(client => client.companyId === formData.companyId)
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsible">Responsável *</Label>
                <Select
                  value={formData.responsibleId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, responsibleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResponsibles.map((responsible) => (
                      <SelectItem key={responsible.id} value={responsible.id}>
                        {responsible.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="requester">Solicitante</Label>
                <Select
                  value={formData.requesterId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, requesterId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um solicitante" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResponsibles.map((responsible) => (
                      <SelectItem key={responsible.id} value={responsible.id}>
                        {responsible.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="approval"
                  checked={formData.approvalRequired}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    approvalRequired: checked,
                    approverId: checked ? prev.approverId : ''
                  }))}
                />
                <Label htmlFor="approval">Requer Aprovação</Label>
              </div>

              {formData.approvalRequired && (
                <div>
                  <Label htmlFor="approver">Aprovador</Label>
                  <Select
                    value={formData.approverId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, approverId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aprovador" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResponsibles.map((responsible) => (
                        <SelectItem key={responsible.id} value={responsible.id}>
                          {responsible.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data de Conclusão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {isPersonal && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Configurações de Lembrete</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reminderBefore">Lembrar quantas horas antes</Label>
                  <Input
                    id="reminderBefore"
                    type="number"
                    min="1"
                    value={formData.personalReminderSettings.reminderBeforeHours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalReminderSettings: {
                        ...prev.personalReminderSettings,
                        reminderBeforeHours: parseInt(e.target.value) || 24
                      }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="reminderFrequency">Frequência (horas)</Label>
                  <Input
                    id="reminderFrequency"
                    type="number"
                    min="1"
                    value={formData.personalReminderSettings.reminderFrequencyHours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalReminderSettings: {
                        ...prev.personalReminderSettings,
                        reminderFrequencyHours: parseInt(e.target.value) || 1
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipos de Notificação</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.personalReminderSettings.emailEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        personalReminderSettings: {
                          ...prev.personalReminderSettings,
                          emailEnabled: checked
                        }
                      }))}
                    />
                    <Label>E-mail</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.personalReminderSettings.whatsappEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        personalReminderSettings: {
                          ...prev.personalReminderSettings,
                          whatsappEnabled: checked
                        }
                      }))}
                    />
                    <Label>WhatsApp</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.personalReminderSettings.smsEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        personalReminderSettings: {
                          ...prev.personalReminderSettings,
                          smsEnabled: checked
                        }
                      }))}
                    />
                    <Label>SMS</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.personalReminderSettings.internalEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        personalReminderSettings: {
                          ...prev.personalReminderSettings,
                          internalEnabled: checked
                        }
                      }))}
                    />
                    <Label>Interna</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : action ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionForm;
