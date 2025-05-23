
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationSettings } from '@/lib/types';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Partial<NotificationSettings>>({
    emailEnabled: true,
    whatsappEnabled: false,
    smsEnabled: false,
    internalEnabled: true,
    reminderBeforeHours: 24,
    reminderFrequencyHours: 1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadSettings();
    }
  }, [user, open]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings({
          emailEnabled: data.email_enabled,
          whatsappEnabled: data.whatsapp_enabled,
          smsEnabled: data.sms_enabled,
          internalEnabled: data.internal_enabled,
          reminderBeforeHours: data.reminder_before_hours,
          reminderFrequencyHours: data.reminder_frequency_hours
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          email_enabled: settings.emailEnabled,
          whatsapp_enabled: settings.whatsappEnabled,
          sms_enabled: settings.smsEnabled,
          internal_enabled: settings.internalEnabled,
          reminder_before_hours: settings.reminderBeforeHours,
          reminder_frequency_hours: settings.reminderFrequencyHours,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar configurações:', error);
        toast.error('Erro ao salvar configurações');
        return;
      }

      toast.success('Configurações salvas com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações de Notificação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Tipos de Notificação</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">E-mail</Label>
                <Switch
                  id="email"
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, emailEnabled: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Switch
                  id="whatsapp"
                  checked={settings.whatsappEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, whatsappEnabled: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sms">SMS</Label>
                <Switch
                  id="sms"
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, smsEnabled: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="internal">Notificação Interna</Label>
                <Switch
                  id="internal"
                  checked={settings.internalEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, internalEnabled: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Configurações de Lembrete</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reminderBefore">Notificar quantas horas antes do vencimento</Label>
                <Input
                  id="reminderBefore"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.reminderBeforeHours}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      reminderBeforeHours: parseInt(e.target.value) || 24 
                    }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="reminderFrequency">Frequência de lembrete (em horas)</Label>
                <Input
                  id="reminderFrequency"
                  type="number"
                  min="1"
                  max="24"
                  value={settings.reminderFrequencyHours}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      reminderFrequencyHours: parseInt(e.target.value) || 1 
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSettings} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsDialog;
