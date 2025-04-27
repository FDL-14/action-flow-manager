
import React, { useState } from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import { useActions } from '@/contexts/ActionContext';
import { toast } from 'sonner';

interface DeleteActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string;
  actionSubject: string;
  onDeleted?: () => void;
}

const DeleteActionDialog: React.FC<DeleteActionDialogProps> = ({ 
  isOpen, 
  onClose, 
  actionId, 
  actionSubject,
  onDeleted 
}) => {
  const { deleteAction } = useActions();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteAction(actionId);
      toast.success(`Ação "${actionSubject}" excluída com sucesso.`);
      onDeleted && onDeleted();
    } catch (error) {
      console.error("Erro ao excluir ação:", error);
      toast.error("Não foi possível excluir esta ação. Tente novamente.");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" /> 
            Confirmar exclusão
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-2 font-medium">Tem certeza que deseja excluir a ação "{actionSubject}"?</p>
            <p>Esta ação não pode ser desfeita.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-700 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteActionDialog;
