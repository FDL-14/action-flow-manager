
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationSettings {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  internalEnabled: boolean;
  reminderBeforeHours: number;
  reminderFrequencyHours: number;
}

const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    whatsappEnabled: false,
    smsEnabled: false,
    internalEnabled: true,
    reminderBeforeHours: 24,
    reminderFrequencyHours: 1
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Aqui você implementaria a lógica para salvar no banco
      // Por enquanto, apenas simula o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Configurações de notificação salvas com sucesso!');
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
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Tipos de Notificação</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="email"
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, emailEnabled: checked }))
                }
              />
              <Label htmlFor="email">E-mail</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="whatsapp"
                checked={settings.whatsappEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, whatsappEnabled: checked }))
                }
              />
              <Label htmlFor="whatsapp">WhatsApp</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sms"
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, smsEnabled: checked }))
                }
              />
              <Label htmlFor="sms">SMS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="internal"
                checked={settings.internalEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, internalEnabled: checked }))
                }
              />
              <Label htmlFor="internal">Notificação Interna</Label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Configurações de Tempo</h3>
            
            <div>
              <Label htmlFor="reminderBefore">Lembrar antes (horas)</Label>
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
              <Label htmlFor="frequency">Frequência de lembretes (horas)</Label>
              <Input
                id="frequency"
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

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsDialog;
