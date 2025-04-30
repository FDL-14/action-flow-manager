
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CompanyForm from '@/components/CompanyForm';
import { Company } from '@/lib/types';
import CompanyList from '@/components/CompanyList';

const CompaniesPage = () => {
  const { user } = useAuth();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowCompanyForm(true);
  };

  // Verify permissions for company editing
  const canEditCompany = user?.role === 'master' || user?.permissions.some(p => p.canEditCompany);

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

      <CompanyList />

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
