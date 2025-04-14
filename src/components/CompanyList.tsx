
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Building } from 'lucide-react';
import CompanyForm from './CompanyForm';
import { Company } from '@/lib/types';

interface CompanyListProps {
  companies: Company[];
}

const CompanyList = ({ companies }: CompanyListProps) => {
  const { setCompany } = useCompany();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const handleEditCompany = (companyToEdit: Company) => {
    setEditingCompany(companyToEdit);
    setShowCompanyForm(true);
  };

  if (companies.length === 0) {
    return <p>Nenhuma empresa cadastrada</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companies.map((companyItem) => (
        <Card key={companyItem.id} className="overflow-hidden">
          <CardHeader className="bg-gray-50">
            <div className="flex justify-between items-start">
              <CardTitle>{companyItem.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => handleEditCompany(companyItem)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {companyItem.id === companies[0]?.id ? 'Empresa Principal' : 'Cliente/Filial'}
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

      <CompanyForm
        open={showCompanyForm}
        onOpenChange={setShowCompanyForm}
        initialData={editingCompany}
        isNewCompany={false}
      />
    </div>
  );
};

export default CompanyList;
