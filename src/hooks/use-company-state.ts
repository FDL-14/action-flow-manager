
import { useState, useEffect } from 'react';
import { Company, Client, Responsible } from '@/lib/types';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { loadCompaniesFromStorage, saveCompaniesToStorage, saveMainCompanyToStorage } from '@/lib/utils/company-utils';
import { defaultCompany } from '@/lib/mock-data';

export const useCompanyState = () => {
  const [company, setCompanyState] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const { toast: toastUI } = useToast();

  useEffect(() => {
    try {
      const { mainCompany, companies: loadedCompanies } = loadCompaniesFromStorage();
      
      if (!mainCompany) {
        console.log("No main company found, using default data");
        setCompanyState(defaultCompany);
        setCompanies([defaultCompany]);
        saveMainCompanyToStorage(defaultCompany);
        saveCompaniesToStorage([defaultCompany]);
      } else {
        setCompanyState(mainCompany);
        setCompanies(loadedCompanies);
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      toastUI({
        title: "Error loading data",
        description: "Using default data due to loading error.",
        variant: "destructive",
      });
      
      setCompanyState(defaultCompany);
      setCompanies([defaultCompany]);
      saveMainCompanyToStorage(defaultCompany);
      saveCompaniesToStorage([defaultCompany]);
    }
  }, [toastUI]);

  useEffect(() => {
    if (companies && companies.length > 0) {
      try {
        saveCompaniesToStorage(companies);
      } catch (error) {
        console.error("Error saving companies:", error);
        toastUI({
          title: "Error saving",
          description: "Could not save companies locally.",
          variant: "destructive",
        });
      }
    }
  }, [companies, toastUI]);

  return {
    company,
    setCompanyState,
    companies,
    setCompanies,
  };
};
