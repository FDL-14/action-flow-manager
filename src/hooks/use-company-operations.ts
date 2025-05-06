
import { Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { saveMainCompanyToStorage } from '@/lib/utils/company-utils';

export const useCompanyOperations = (
  company: Company | null,
  setCompanyState: (company: Company) => void,
  companies: Company[],
  setCompanies: (companies: Company[]) => void
) => {
  const { toast } = useToast();

  const setCompany = (newCompany: Company) => {
    setCompanyState(newCompany);
    saveMainCompanyToStorage(newCompany);
    
    const updatedCompanies = companies.map(c => 
      c.id === newCompany.id ? newCompany : c
    );
    setCompanies(updatedCompanies);
    
    toast({
      title: "Empresa atualizada",
      description: `As informações da empresa foram atualizadas com sucesso.`,
      variant: "default",
    });
  };
  
  const addCompany = (companyData: Omit<Company, 'id'>) => {
    const newCompany: Company = {
      id: Date.now().toString(),
      ...companyData
    };
    
    const updatedCompanies = [...companies, newCompany];
    setCompanies(updatedCompanies);
    
    toast({
      title: "Empresa adicionada",
      description: `A empresa ${companyData.name} foi adicionada com sucesso.`,
      variant: "default",
    });
    
    return newCompany;
  };
  
  const updateCompany = (updatedCompany: Company) => {
    const updatedCompanies = companies.map(c => 
      c.id === updatedCompany.id ? { ...updatedCompany, updatedAt: new Date() } : c
    );
    
    setCompanies(updatedCompanies);
    
    if (company && company.id === updatedCompany.id) {
      const updatedMainCompany = { ...updatedCompany, updatedAt: new Date() };
      setCompanyState(updatedMainCompany);
      saveMainCompanyToStorage(updatedMainCompany);
    }
    
    toast({
      title: "Empresa atualizada",
      description: `A empresa ${updatedCompany.name} foi atualizada com sucesso.`,
      variant: "default",
    });
  };
  
  const deleteCompany = (id: string) => {
    if (company && company.id === id) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir a empresa principal",
        variant: "destructive",
      });
      return;
    }
    
    const updatedCompanies = companies.filter(c => c.id !== id);
    setCompanies(updatedCompanies);
    
    toast({
      title: "Empresa excluída",
      description: "A empresa foi excluída com sucesso",
      variant: "default",
    });
  };

  const updateCompanyLogo = (logoUrl: string) => {
    if (!company) return;
    
    const updatedCompany = {
      ...company,
      logo: logoUrl,
      updatedAt: new Date()
    };
    
    setCompanyState(updatedCompany);
    saveMainCompanyToStorage(updatedCompany);
    
    const updatedCompanies = companies.map(c => 
      c.id === company.id ? updatedCompany : c
    );
    setCompanies(updatedCompanies);
    
    toast({
      title: "Logo atualizado",
      description: "O logo da empresa foi atualizado com sucesso.",
      variant: "default",
    });
  };

  return {
    setCompany,
    addCompany,
    updateCompany,
    deleteCompany,
    updateCompanyLogo,
  };
};
