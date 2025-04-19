
import { Company, Client, Responsible } from '@/lib/types';
import { toast } from 'sonner';

export const loadCompaniesFromStorage = (): { 
  mainCompany: Company | null;
  companies: Company[];
} => {
  let mainCompany: Company | null = null;
  let savedCompanies: Company[] = [];
  
  const savedCompaniesData = localStorage.getItem('companies');
  if (savedCompaniesData) {
    const parsedCompanies = JSON.parse(savedCompaniesData);
    if (Array.isArray(parsedCompanies) && parsedCompanies.length > 0) {
      console.log("Loading companies from localStorage:", parsedCompanies.length);
      savedCompanies = parsedCompanies;
      mainCompany = savedCompanies[0];
    }
  }
  
  const savedMainCompany = localStorage.getItem('company');
  if (savedMainCompany) {
    const parsedCompany = JSON.parse(savedMainCompany);
    if (parsedCompany && parsedCompany.id) {
      console.log("Loading main company from localStorage");
      mainCompany = parsedCompany;
      
      if (!savedCompanies.some(c => c.id === mainCompany!.id)) {
        savedCompanies = [mainCompany, ...savedCompanies];
      }
    }
  }
  
  return { mainCompany, companies: savedCompanies };
};

export const saveCompaniesToStorage = (companies: Company[]) => {
  try {
    localStorage.setItem('companies', JSON.stringify(companies));
    return true;
  } catch (error) {
    console.error("Error saving companies to localStorage:", error);
    return false;
  }
};

export const saveMainCompanyToStorage = (company: Company) => {
  try {
    localStorage.setItem('company', JSON.stringify(company));
    return true;
  } catch (error) {
    console.error("Error saving main company to localStorage:", error);
    return false;
  }
};
