
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useActions } from '@/contexts/ActionContext';
import { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Check, Paperclip, FileText, AlertTriangle, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ActionNotes from './ActionNotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ActionCardProps {
  action: Action;
}

const ActionCard: React.FC<ActionCardProps> = ({ action }) => {
  const { responsibles, clients } = useCompany();
  const { updateActionStatus } = useActions();
  const [showNotes, setShowNotes] = useState(false);
  const { toast } = useToast();

  const responsible = responsibles.find(r => r.id === action.responsibleId);
  const client = action.clientId ? clients.find(c => c.id === action.clientId) : null;
  const requester = action.requesterId ? responsibles.find(r => r.id === action.requesterId) : null;
  
  const getStatusColor = () => {
    switch(action.status) {
      case 'concluido':
        return 'border-l-green-500 bg-green-50';
      case 'atrasado':
        return 'border-l-red-500 bg-red-50';
      case 'pendente':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500';
    }
  };

  const getStatusBadge = () => {
    switch(action.status) {
      case 'concluido':
        return <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-500 hover:bg-red-600">Atrasado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Pendente</Badge>;
      default:
        return null;
    }
  };

  const handleMarkComplete = () => {
    updateActionStatus(action.id, 'concluido', new Date());
    toast({
      title: "Ação concluída",
      description: "A ação foi marcada como concluída com sucesso.",
      variant: "default",
    });
  };

  const handleMarkIncomplete = () => {
    updateActionStatus(action.id, 'pendente');
    toast({
      title: "Ação pendente",
      description: "A ação foi marcada como pendente.",
      variant: "default",
    });
  };

  const handleMarkDelayed = () => {
    updateActionStatus(action.id, 'atrasado');
    toast({
      title: "Ação atrasada",
      description: "A ação foi marcada como atrasada.",
      variant: "destructive",
    });
  };

  const handleSendEmail = () => {
    toast({
      title: "Email enviado",
      description: "Função de envio de email será implementada em breve.",
      variant: "default",
    });
  };

  const toggleNotes = () => setShowNotes(!showNotes);

  return (
    <Card className={`mb-4 border-l-4 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge()}
              <h3 className="text-lg font-semibold">{action.subject}</h3>
            </div>
            {client && (
              <div className="text-sm text-gray-600 mb-1">
                Cliente: {client.name}
              </div>
            )}
            {responsible && (
              <div className="text-sm text-gray-600 mb-1">
                Responsável: {responsible.name}
              </div>
            )}
            {requester && (
              <div className="text-sm text-gray-600 mb-2">
                Solicitante: {requester.name}
              </div>
            )}
            <p className="text-sm text-gray-700 mb-3">{action.description}</p>
            <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Início:</span> {action.startDate.toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Término:</span> {action.endDate.toLocaleDateString()}
              </div>
              {action.completedAt && (
                <div className="col-span-2 mt-1">
                  <span className="font-medium">Concluído em:</span> {action.completedAt.toLocaleDateString()} 
                  ({formatDistanceToNow(action.completedAt, { addSuffix: true, locale: ptBR })})
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendEmail}
              className="hidden sm:flex"
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {action.status !== 'concluido' && (
                  <DropdownMenuItem onClick={handleMarkComplete}>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Marcar como concluído
                  </DropdownMenuItem>
                )}
                {action.status === 'concluido' && (
                  <DropdownMenuItem onClick={handleMarkIncomplete}>
                    Marcar como pendente
                  </DropdownMenuItem>
                )}
                {action.status !== 'atrasado' && (
                  <DropdownMenuItem onClick={handleMarkDelayed}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                    Marcar como atrasado
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={toggleNotes}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver anotações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendEmail} className="sm:hidden">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {(action.attachments && action.attachments.length > 0) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center text-sm text-gray-600">
              <Paperclip className="h-4 w-4 mr-1" />
              <span>{action.attachments.length} anexo(s)</span>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Anotações - {action.subject}</DialogTitle>
          </DialogHeader>
          <ActionNotes action={action} />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ActionCard;
