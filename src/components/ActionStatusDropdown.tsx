
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActions } from '@/contexts/ActionContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Action } from '@/lib/types';

interface ActionStatusDropdownProps {
  actionId: string;
  status: string;
}

const ActionStatusDropdown: React.FC<ActionStatusDropdownProps> = ({ actionId, status }) => {
  const { updateActionStatus } = useActions();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: 'pendente' | 'concluido' | 'atrasado' | 'aguardando_aprovacao') => {
    setIsUpdating(true);
    try {
      await updateActionStatus(actionId, newStatus);
    } catch (error) {
      console.error('Error updating action status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusConfig = (statusType: string) => {
    switch (statusType) {
      case 'concluido':
        return { label: 'Concluído', color: 'bg-green-100 text-green-800 hover:bg-green-200', icon: <Check className="w-4 h-4 text-green-600 mr-2" /> };
      case 'pendente':
        return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', icon: null };
      case 'atrasado':
        return { label: 'Atrasado', color: 'bg-red-100 text-red-800 hover:bg-red-200', icon: null };
      default:
        return { label: 'Indefinido', color: 'bg-gray-100 text-gray-800 hover:bg-gray-200', icon: null };
    }
  };

  const currentStatusConfig = getStatusConfig(status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <Button variant="ghost" size="sm" className="p-1">
          <Badge className={currentStatusConfig.color}>
            {currentStatusConfig.label}
          </Badge>
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleStatusChange('pendente')}
          className={`flex items-center ${status === 'pendente' ? 'bg-yellow-50' : ''}`}
        >
          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
          Pendente
          {status === 'pendente' && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleStatusChange('concluido')}
          className={`flex items-center ${status === 'concluido' ? 'bg-green-50' : ''}`}
        >
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
          Concluído
          {status === 'concluido' && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleStatusChange('atrasado')}
          className={`flex items-center ${status === 'atrasado' ? 'bg-red-50' : ''}`}
        >
          <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
          Atrasado
          {status === 'atrasado' && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionStatusDropdown;
