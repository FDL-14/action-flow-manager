
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
      title: "Company updated",
      description: `Company information has been updated successfully.`,
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
      title: "Company added",
      description: `Company ${companyData.name} has been added successfully.`,
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
      title: "Company updated",
      description: `Company ${updatedCompany.name} has been updated successfully.`,
      variant: "default",
    });
  };
  
  const deleteCompany = (id: string) => {
    if (company && company.id === id) {
      toast({
        title: "Operation not allowed",
        description: "Cannot delete the main company",
        variant: "destructive",
      });
      return;
    }
    
    const updatedCompanies = companies.filter(c => c.id !== id);
    setCompanies(updatedCompanies);
    
    toast({
      title: "Company deleted",
      description: "Company has been deleted successfully",
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
      title: "Logo updated",
      description: "Company logo has been updated successfully.",
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
