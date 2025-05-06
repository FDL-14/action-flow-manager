
import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Pencil, Trash2, Phone, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CompanyForm from '@/components/CompanyForm';
import { Company, Client } from '@/lib/types';
import CompanyList from '@/components/CompanyList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const CompaniesPage = () => {
  const { user } = useAuth();
  const { company: mainCompany, companies, clients, deleteCompany, getClientsByCompanyId } = useCompany();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyClients, setCompanyClients] = useState<{[key: string]: Client[]}>({});
  const [loading, setLoading] = useState(true);

  // Verify permissions for company editing
  const canEditCompany = user?.role === 'master' || user?.permissions?.some(p => p.canEditCompany);
  const canDeleteCompany = user?.role === 'master' || user?.permissions?.some(p => p.canDeleteCompany);

  useEffect(() => {
    const loadClientsByCompany = () => {
      setLoading(true);
      try {
        const clientsMap: {[key: string]: Client[]} = {};
        
        companies.forEach(company => {
          clientsMap[company.id] = getClientsByCompanyId(company.id);
        });
        
        setCompanyClients(clientsMap);
      } catch (error) {
        console.error("Error loading clients by company:", error);
        toast.error("Erro ao carregar clientes por empresa");
      } finally {
        setLoading(false);
      }
    };

    loadClientsByCompany();
  }, [companies, clients, getClientsByCompanyId]);

  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowCompanyForm(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowCompanyForm(true);
  };
  
  const handleDeleteCompany = (companyId: string) => {
    if (companyId === mainCompany?.id) {
      toast.error("Não é possível excluir", { description: "A empresa principal não pode ser excluída" });
      return;
    }
    
    if (getClientCountByCompany(companyId) > 0) {
      toast.error("Não é possível excluir", { description: "Existem clientes associados a esta empresa" });
      return;
    }
    
    try {
      deleteCompany(companyId);
      toast.success("Empresa excluída", { description: "A empresa foi removida com sucesso" });
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Erro ao excluir", { description: "Não foi possível excluir a empresa" });
    }
  };

  const getClientCountByCompany = (companyId: string): number => {
    return companyClients[companyId]?.length || 0;
  };

  return (
    <div className="container mx-auto py-6 h-full overflow-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Empresas</h1>
        {canEditCompany && (
          <Button onClick={handleAddCompany} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        )}
      </div>

      {mainCompany && (
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Empresa Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Nome da Empresa</span>
                  <span className="text-gray-900 font-medium">{mainCompany.name}</span>
                </div>
                {mainCompany.cnpj && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">CNPJ</span>
                    <span className="text-gray-900 font-medium">{mainCompany.cnpj}</span>
                  </div>
                )}
                {mainCompany.phone && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Telefone</span>
                    <span className="text-gray-900 font-medium">{mainCompany.phone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {mainCompany.address && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Endereço</span>
                    <span className="text-gray-900 font-medium">{mainCompany.address}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Clientes Associados</span>
                  <span className="text-gray-900 font-medium">
                    {getClientCountByCompany(mainCompany.id)} clientes
                  </span>
                </div>
              </div>
              {mainCompany.logo && (
                <div className="col-span-1 md:col-span-2 flex justify-start">
                  <div className="w-32 h-32 border rounded p-1">
                    <img 
                      src={mainCompany.logo} 
                      alt={`Logo ${mainCompany.name}`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
            {canEditCompany && (
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditCompany(mainCompany)}
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Empresa Principal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-semibold my-4">Todas as Empresas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Nenhuma empresa cadastrada</h3>
            <p className="text-sm text-gray-500 mb-4">Adicione sua primeira empresa para começar</p>
            {canEditCompany && (
              <Button onClick={handleAddCompany}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            )}
          </div>
        ) : (
          companies.map(company => (
            <Card key={company.id} className="overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-medium truncate">{company.name}</h3>
                {company.id === mainCompany?.id && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    Principal
                  </span>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                {company.cnpj && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">CNPJ</p>
                      <p className="text-sm text-gray-600">{company.cnpj}</p>
                    </div>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Telefone</p>
                      <p className="text-sm text-gray-600">{company.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Clientes</p>
                    <p className="text-sm text-gray-600">
                      {getClientCountByCompany(company.id)} clientes associados
                    </p>
                  </div>
                </div>
              </CardContent>
              <div className="border-t p-2 bg-gray-50 flex justify-end gap-2">
                {canEditCompany && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditCompany(company)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDeleteCompany && company.id !== mainCompany?.id && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={getClientCountByCompany(company.id) > 0}
                    title={
                      getClientCountByCompany(company.id) > 0 
                        ? "Não é possível excluir - existem clientes associados" 
                        : "Excluir empresa"
                    }
                    onClick={() => handleDeleteCompany(company.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
        
        {/* Card para adicionar nova empresa */}
        {canEditCompany && (
          <button
            onClick={handleAddCompany}
            className="h-full min-h-[200px] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <span className="font-medium text-gray-800">Nova Empresa</span>
          </button>
        )}
      </div>

      <CompanyForm
        open={showCompanyForm}
        onOpenChange={setShowCompanyForm}
        initialData={editingCompany}
        isNewCompany={!editingCompany}
      />
    </div>
  );
};

export default CompaniesPage;
