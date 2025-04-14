
import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import CompanyForm from '@/components/CompanyForm';
import { Company } from '@/lib/types';
import CompanyList from '@/components/CompanyList';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CompanyPage = () => {
  const { company, setCompany } = useCompany();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar empresas do Supabase
  useEffect(() => {
    async function fetchCompanies() {
      try {
        setLoading(true);
        const { data: companiesData, error } = await supabase
          .from('companies')
          .select('*')
          .order('name');

        if (error) {
          console.error('Erro ao buscar empresas:', error);
          toast.error('Não foi possível carregar as empresas');
          return;
        }

        if (companiesData && companiesData.length > 0) {
          // Converter para o formato esperado pela aplicação
          const formattedCompanies: Company[] = companiesData.map(item => ({
            id: item.id,
            name: item.name,
            address: item.address || '',
            cnpj: item.cnpj || '',
            phone: item.phone || '',
            logo: item.logo || undefined,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at)
          }));
          
          setCompanies(formattedCompanies);
          
          // Se ainda não tiver uma empresa principal definida, use a primeira
          if (!company && formattedCompanies.length > 0) {
            setCompany(formattedCompanies[0]);
          }
        }
      } catch (error) {
        console.error('Erro ao processar dados de empresas:', error);
        toast.error('Erro ao processar dados de empresas');
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, [company, setCompany]);

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
        {loading ? (
          <p>Carregando empresas...</p>
        ) : (
          <CompanyList companies={companies} />
        )}
      </div>

      <CompanyForm
        open={showCompanyForm}
        onOpenChange={setShowCompanyForm}
        initialData={company}
        isNewCompany={false}
      />

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
