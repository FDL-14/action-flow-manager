
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import CompanyForm from '@/components/CompanyForm';
import { Company } from '@/lib/types';
import CompanyList from '@/components/CompanyList';

const CompanyPage = () => {
  const { company } = useCompany();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Configurações da Empresa</h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={() => setShowCompanyForm(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar Empresa
          </Button>
          <Button onClick={() => setShowNewCompanyForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {company && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Informações da Empresa Principal</h2>
            <p className="text-sm text-gray-500 mb-6">Dados básicos da empresa registrada no sistema.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Nome da Empresa</p>
                  <p className="text-base">{company.name}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Data de Cadastro</p>
                  <p className="text-base">
                    {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">CNPJ</p>
                  <p className="text-base">{company.cnpj || 'Não informado'}</p>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Endereço</p>
                  <p className="text-base">{company.address || 'Não informado'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Telefone</p>
                  <p className="text-base">{company.phone || 'Não informado'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Logo</p>
                  {company.logo ? (
                    <div className="mt-2">
                      <img
                        src={company.logo}
                        alt={`${company.name} Logo`}
                        className="h-16 object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-base">Não informada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exibir todas as empresas cadastradas */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Todas as Empresas Cadastradas</h2>
        <CompanyList />
      </div>

      {/* Edit existing company form */}
      <CompanyForm
        open={showCompanyForm}
        onOpenChange={setShowCompanyForm}
        initialData={company}
        isNewCompany={false}
      />

      {/* Create new company form */}
      <CompanyForm
        open={showNewCompanyForm}
        onOpenChange={setShowNewCompanyForm}
        initialData={null}
        isNewCompany={true}
      />
    </div>
  );
};

export default CompanyPage;
