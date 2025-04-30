
import React, { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Check, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
import CompanyForm from './CompanyForm';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

interface CompanyListProps {
  // No props needed for now
}

const CompanyList = () => {
  const { companies, deleteCompany } = useCompany();
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string>("");
  const [companyNameToDelete, setCompanyNameToDelete] = useState<string>("");
  const { toast } = useToast();
  
  // New state for selected companies to delete
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setShowEditForm(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company.id);
    setCompanyNameToDelete(company.name);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteCompany(companyToDelete);
    setShowDeleteDialog(false);
    toast({
      title: "Empresa excluída",
      description: `A empresa "${companyNameToDelete}" foi excluída com sucesso.`,
    });
  };

  const confirmBatchDelete = () => {
    selectedCompanies.forEach(companyId => {
      deleteCompany(companyId);
    });
    setShowBatchDeleteDialog(false);
    setSelectedCompanies([]);
    setSelectAll(false);
    toast({
      title: "Empresas excluídas",
      description: `${selectedCompanies.length} empresas foram excluídas com sucesso.`,
    });
  };
  
  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };
  
  const cancelBatchDelete = () => {
    setShowBatchDeleteDialog(false);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(company => company.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectCompany = (companyId: string) => {
    if (selectedCompanies.includes(companyId)) {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    } else {
      setSelectedCompanies([...selectedCompanies, companyId]);
    }
  };

  // Check if we need to update selectAll state when selectedCompanies changes
  useEffect(() => {
    if (companies.length > 0 && selectedCompanies.length === companies.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedCompanies, companies]);

  const canEditCompany = user?.role === 'master' || user?.permissions.some(p => p.canEditCompany);
  const canDeleteCompany = user?.role === 'master' || user?.permissions.some(p => p.canDeleteCompany);
  
  const handleBatchDeleteClick = () => {
    if (selectedCompanies.length === 0) {
      toast({
        title: "Nenhuma empresa selecionada",
        description: "Por favor, selecione pelo menos uma empresa para excluir.",
        variant: "destructive"
      });
      return;
    }
    setShowBatchDeleteDialog(true);
  };

  // Removed the automatic deletion of "Total Data" companies

  return (
    <div>
      {canDeleteCompany && selectedCompanies.length > 0 && (
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedCompanies.length} {selectedCompanies.length === 1 ? 'empresa selecionada' : 'empresas selecionadas'}
          </div>
          <Button 
            onClick={handleBatchDeleteClick}
            variant="destructive"
            size="sm"
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Excluir selecionadas
          </Button>
        </div>
      )}
        
      {companies.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Nenhuma empresa cadastrada.
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-240px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {canDeleteCompany && (
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox 
                      checked={selectAll} 
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todas as empresas"
                    />
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNPJ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id}>
                  {canDeleteCompany && (
                    <td className="px-2 py-4 whitespace-nowrap">
                      <Checkbox 
                        checked={selectedCompanies.includes(company.id)} 
                        onCheckedChange={() => toggleSelectCompany(company.id)}
                        aria-label={`Selecionar empresa ${company.name}`}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {company.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.cnpj || 'Não informado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.phone || 'Não informado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canEditCompany && (
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteCompany && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(company)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
      
      {/* Company edit form */}
      {selectedCompany && (
        <CompanyForm
          open={showEditForm}
          onOpenChange={setShowEditForm}
          initialData={selectedCompany}
          isNewCompany={false}
        />
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa "{companyNameToDelete}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Batch Delete confirmation dialog */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedCompanies.length} {selectedCompanies.length === 1 ? 'empresa' : 'empresas'}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelBatchDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBatchDelete} className="bg-red-500 hover:bg-red-700 text-white">
              Excluir {selectedCompanies.length} {selectedCompanies.length === 1 ? 'empresa' : 'empresas'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyList;
