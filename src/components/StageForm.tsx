
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ActionStage } from '@/lib/types';

interface StageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionId: string;
  parentStageId?: string | null;
  stage?: ActionStage | null;
  onSaved: () => void;
}

const StageForm: React.FC<StageFormProps> = ({
  open,
  onOpenChange,
  actionId,
  parentStageId,
  stage,
  onSaved
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isSequential: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stage) {
      setFormData({
        title: stage.title,
        description: stage.description || '',
        isSequential: stage.isSequential
      });
    } else {
      setFormData({
        title: '',
        description: '',
        isSequential: true
      });
    }
  }, [stage, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('O título da etapa é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const stageData = {
        action_id: actionId,
        title: formData.title,
        description: formData.description,
        parent_stage_id: parentStageId,
        is_sequential: formData.isSequential,
        created_by: user?.id,
        updated_at: new Date().toISOString()
      };

      if (stage) {
        // Atualizar etapa existente
        const { error } = await supabase
          .from('action_stages')
          .update(stageData)
          .eq('id', stage.id);

        if (error) {
          console.error('Erro ao atualizar etapa:', error);
          toast.error('Erro ao atualizar etapa');
          return;
        }

        toast.success('Etapa atualizada com sucesso!');
      } else {
        // Criar nova etapa
        const { error } = await supabase
          .from('action_stages')
          .insert(stageData);

        if (error) {
          console.error('Erro ao criar etapa:', error);
          toast.error('Erro ao criar etapa');
          return;
        }

        toast.success('Etapa criada com sucesso!');
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      toast.error('Erro ao salvar etapa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {stage ? 'Editar' : 'Nova'} Etapa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da etapa"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite a descrição da etapa"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="sequential"
              checked={formData.isSequential}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSequential: checked }))}
            />
            <Label htmlFor="sequential">
              Etapa Sequencial
              <span className="text-sm text-gray-500 block">
                {formData.isSequential 
                  ? 'As sub-etapas devem ser concluídas em ordem' 
                  : 'As sub-etapas podem ser executadas em paralelo'
                }
              </span>
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : stage ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StageForm;
