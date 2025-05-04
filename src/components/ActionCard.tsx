
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Action } from '@/lib/types';
import { useActions } from '@/contexts/ActionContext';
import ActionStatusDropdown from './ActionStatusDropdown';
import EditActionForm from './EditActionForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ptBR } from 'date-fns/locale';

interface ActionCardProps {
  action: Action;
  onDelete?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, onDelete }) => {
  const { deleteAction } = useActions();
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Function to format date to localized string with proper locale
  const formatDateToLocalString = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const handleDeleteAction = async () => {
    try {
      await deleteAction(action.id);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting action:', error);
      toast.error('Erro ao excluir ação');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'atrasado':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-l-4 hover:shadow-md transition-shadow duration-200" 
      style={{ 
        borderLeftColor: 
          action.status === 'concluido' ? '#22c55e' : 
          action.status === 'pendente' ? '#eab308' : 
          action.status === 'atrasado' ? '#ef4444' : 
          '#94a3b8'
      }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg font-medium">{action.subject}</CardTitle>
            <CardDescription className="mt-1">
              {action.companyName} {action.clientName ? `- ${action.clientName}` : ''}
            </CardDescription>
          </div>
          <div>
            <ActionStatusDropdown actionId={action.id} status={action.status || 'pendente'} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{action.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline">
            Responsável: {action.responsibleName || 'Não atribuído'}
          </Badge>
          {action.requesterName && (
            <Badge variant="outline">
              Solicitante: {action.requesterName}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {formatDateToLocalString(new Date(action.startDate))} - {formatDateToLocalString(new Date(action.endDate))}
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-1" /> Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a excluir a ação "{action.subject}". Esta ação é irreversível.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAction} className="bg-red-600 hover:bg-red-700">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>

      {showEditDialog && (
        <EditActionForm
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          action={action}
        />
      )}
    </Card>
  );
};

export default ActionCard;
