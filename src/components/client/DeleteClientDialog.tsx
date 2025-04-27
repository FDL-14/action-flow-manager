
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Client } from "@/lib/types";
import { toast } from "sonner";

interface DeleteClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  client?: Client; // Passando o objeto cliente completo ao invés de apenas o nome
}

export const DeleteClientDialog = ({
  isOpen,
  onClose,
  onConfirm,
  client
}: DeleteClientDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      toast({
        title: "Cliente excluído",
        description: `O cliente ${client?.name || ''} foi excluído com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir este cliente. Tente novamente.",
        variant: "destructive",
      });
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
            <p className="mb-2 font-medium">Tem certeza que deseja excluir o cliente {client?.name || ''}?</p>
            <p>Esta ação não pode ser desfeita e todas as ações associadas a este cliente podem ser afetadas.</p>
            {client?.companyId && (
              <p className="mt-2 text-amber-600">
                Este cliente está associado a uma empresa e sua exclusão pode afetar o relacionamento com outras entidades.
              </p>
            )}
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
