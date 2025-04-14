
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Building, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CompanyForm from '@/components/CompanyForm';
import { Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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

const CompaniesPage = () => {
  const { company, companies, deleteCompany } = useCompany();
  const { user } = useAuth();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const [companiesList, setCompaniesList] = useState<Company[]>([]);

  // Ensure companies are properly loaded
  useState(() => {
    if (companies && companies.length > 0) {
      console.log("Companies loaded:", companies.length);
      setCompaniesList(companies);
    }
  });

  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowCompanyForm(true);
  };

  const handleEditCompany = (companyToEdit: Company) => {
    setEditingCompany(companyToEdit);
    setShowCompanyForm(true);
  };

  const handleDeleteCompany = (companyId: string) => {
    if (companyId === company?.id) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir a empresa principal",
        variant: "destructive",
      });
      return;
    }
    
    setCompanyToDelete(companyId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (companyToDelete) {
      deleteCompany(companyToDelete);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  // Verify permissions for company editing and deletion
  const canEditCompany = user?.role === 'master' || user?.permissions.some(p => p.canEditCompany);
  const canDeleteCompany = user?.role === 'master' || user?.permissions.some(p => p.canDeleteCompany);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Empresas</h1>
        {canEditCompany && (
          <Button onClick={handleAddCompany} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        )}
      </div>

      {companiesList.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500">Nenhuma empresa encontrada. Clique em "Nova Empresa" para adicionar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companiesList.map((companyItem) => (
            <Card key={companyItem.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex justify-between items-start">
                  <CardTitle>{companyItem.name}</CardTitle>
                  <div className="flex space-x-2">
                    {canEditCompany && (
                      <Button variant="ghost" size="icon" onClick={() => handleEditCompany(companyItem)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteCompany && companyItem.id !== company?.id && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteCompany(companyItem.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {companyItem.id === company?.id ? 'Empresa Principal' : 'Empresa'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {companyItem.logo && (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={companyItem.logo} 
                        alt={`${companyItem.name} Logo`} 
                        className="h-16 object-contain" 
                      />
                    </div>
                  )}
                  <div className="flex items-start">
                    <Building className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Endereço</p>
                      <p className="text-sm text-gray-600">
                        {companyItem.address || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">CNPJ</p>
                    <p className="text-sm text-gray-600">
                      {companyItem.cnpj || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Telefone</p>
                    <p className="text-sm text-gray-600">
                      {companyItem.phone || 'Não informado'}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 flex justify-between">
                <p className="text-xs text-gray-500">
                  Cadastrado em: {new Date(companyItem.createdAt).toLocaleDateString()}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CompanyForm
        open={showCompanyForm}
        onOpenChange={setShowCompanyForm}
        initialData={editingCompany}
        isNewCompany={!editingCompany}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompaniesPage;
