
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, Client, Responsible } from '@/lib/types';
import { defaultCompany, mockClients, mockResponsibles } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface CompanyContextType {
  company: Company | null;
  clients: Client[];
  responsibles: Responsible[];
  setCompany: (company: Company) => void;
  addClient: (client: Omit<Client, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => void;
  addResponsible: (responsible: Omit<Responsible, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => void;
  updateCompanyLogo: (logoUrl: string) => void;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  clients: [],
  responsibles: [],
  setCompany: () => {},
  addClient: () => {},
  addResponsible: () => {},
  updateCompanyLogo: () => {}
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompanyState] = useState<Company | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load from localStorage if available
    const savedCompany = localStorage.getItem('company');
    const savedClients = localStorage.getItem('clients');
    const savedResponsibles = localStorage.getItem('responsibles');

    if (savedCompany) {
      try {
        setCompanyState(JSON.parse(savedCompany));
      } catch (error) {
        console.error('Error parsing company data:', error);
        setCompanyState(defaultCompany);
      }
    } else {
      setCompanyState(defaultCompany);
    }

    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch (error) {
        console.error('Error parsing clients data:', error);
        setClients(mockClients);
      }
    } else {
      setClients(mockClients);
    }

    if (savedResponsibles) {
      try {
        setResponsibles(JSON.parse(savedResponsibles));
      } catch (error) {
        console.error('Error parsing responsibles data:', error);
        setResponsibles(mockResponsibles);
      }
    } else {
      setResponsibles(mockResponsibles);
    }
  }, []);

  const setCompany = (newCompany: Company) => {
    setCompanyState(newCompany);
    localStorage.setItem('company', JSON.stringify(newCompany));
    toast({
      title: "Empresa atualizada",
      description: `As informações da empresa foram atualizadas com sucesso.`,
      variant: "default",
    });
  };

  const addClient = (clientData: Omit<Client, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    if (!company) return;
    
    const newClient: Client = {
      id: (clients.length + 1).toString(),
      companyId: company.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...clientData
    };
    
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    localStorage.setItem('clients', JSON.stringify(updatedClients));
    
    toast({
      title: "Cliente adicionado",
      description: `O cliente ${clientData.name} foi adicionado com sucesso.`,
      variant: "default",
    });
  };

  const addResponsible = (responsibleData: Omit<Responsible, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    if (!company) return;
    
    const newResponsible: Responsible = {
      id: (responsibles.length + 1).toString(),
      companyId: company.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...responsibleData
    };
    
    const updatedResponsibles = [...responsibles, newResponsible];
    setResponsibles(updatedResponsibles);
    localStorage.setItem('responsibles', JSON.stringify(updatedResponsibles));
    
    toast({
      title: "Responsável adicionado",
      description: `${responsibleData.name} foi adicionado(a) com sucesso como responsável.`,
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
    localStorage.setItem('company', JSON.stringify(updatedCompany));
    
    toast({
      title: "Logo atualizada",
      description: "A logo da empresa foi atualizada com sucesso.",
      variant: "default",
    });
  };

  return (
    <CompanyContext.Provider 
      value={{ 
        company, 
        clients, 
        responsibles, 
        setCompany, 
        addClient, 
        addResponsible,
        updateCompanyLogo
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
