
import React, { createContext, useContext } from 'react';
import { Company, Client, Responsible } from '@/lib/types';
import { mockClients, mockResponsibles } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { useCompanyState } from '@/hooks/use-company-state';
import { useCompanyOperations } from '@/hooks/use-company-operations';

interface CompanyContextType {
  company: Company | null;
  companies: Company[];
  clients: Client[];
  responsibles: Responsible[];
  setCompany: (company: Company) => void;
  addCompany: (company: Omit<Company, 'id'>) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addResponsible: (responsible: Omit<Responsible, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => void;
  updateResponsible: (responsible: Responsible) => void;
  deleteResponsible: (id: string) => void;
  updateCompanyLogo: (logoUrl: string) => void;
  getClientsByCompanyId: (companyId: string) => Client[];
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  companies: [],
  clients: [],
  responsibles: [],
  setCompany: () => {},
  addCompany: () => {},
  updateCompany: () => {},
  deleteCompany: () => {},
  addClient: () => {},
  updateClient: () => {},
  deleteClient: () => {},
  addResponsible: () => {},
  updateResponsible: () => {},
  deleteResponsible: () => {},
  updateCompanyLogo: () => {},
  getClientsByCompanyId: () => [],
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { company, setCompanyState, companies, setCompanies } = useCompanyState();
  const { setCompany, addCompany, updateCompany, deleteCompany, updateCompanyLogo } = 
    useCompanyOperations(company, setCompanyState, companies, setCompanies);
  const { toast: toastUI } = useToast();
  const [clients, setClients] = React.useState<Client[]>(mockClients);
  const [responsibles, setResponsibles] = React.useState<Responsible[]>(mockResponsibles);

  React.useEffect(() => {
    try {
      if (clients && clients.length > 0) {
        localStorage.setItem('clients', JSON.stringify(clients));
      }
    } catch (error) {
      console.error("Error saving clients:", error);
      toastUI({
        title: "Error saving",
        description: "Could not save clients locally.",
        variant: "destructive",
      });
    }
  }, [clients, toastUI]);

  React.useEffect(() => {
    try {
      if (responsibles && responsibles.length > 0) {
        localStorage.setItem('responsibles', JSON.stringify(responsibles));
      }
    } catch (error) {
      console.error("Error saving responsibles:", error);
      toastUI({
        title: "Error saving",
        description: "Could not save responsibles locally.",
        variant: "destructive",
      });
    }
  }, [responsibles, toastUI]);

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!company) return;
    
    const newClient: Client = {
      id: Date.now().toString(),
      companyId: clientData.companyId || company.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...clientData
    };
    
    setClients([...clients, newClient]);
    
    toastUI({
      title: "Client added",
      description: `Client ${clientData.name} has been added successfully.`,
      variant: "default",
    });
  };

  const updateClient = (updatedClient: Client) => {
    if (!company) return;
    
    const updatedClients = clients.map(c => 
      c.id === updatedClient.id ? { ...updatedClient, updatedAt: new Date() } : c
    );
    
    setClients(updatedClients);
    
    toast.success("Client updated successfully!");
  };

  const deleteClient = (id: string) => {
    if (!company) return;
    
    setClients(clients.filter(c => c.id !== id));
    
    toast.success("Client deleted successfully!");
  };

  const addResponsible = (responsibleData: Omit<Responsible, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    if (!company) return;
    
    const newResponsible: Responsible = {
      id: Date.now().toString(),
      companyId: company.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...responsibleData
    };
    
    setResponsibles([...responsibles, newResponsible]);
  };

  const updateResponsible = (updatedResponsible: Responsible) => {
    if (!company) return;
    
    const updatedResponsibles = responsibles.map(r => 
      r.id === updatedResponsible.id ? { ...updatedResponsible, updatedAt: new Date() } : r
    );
    
    setResponsibles(updatedResponsibles);
  };

  const deleteResponsible = (id: string) => {
    if (!company) return;
    
    setResponsibles(responsibles.filter(r => r.id !== id));
  };

  const getClientsByCompanyId = (companyId: string): Client[] => {
    return clients.filter(client => client.companyId === companyId);
  };

  return (
    <CompanyContext.Provider 
      value={{ 
        company, 
        companies,
        clients, 
        responsibles, 
        setCompany,
        addCompany,
        updateCompany,
        deleteCompany,
        addClient,
        updateClient,
        deleteClient, 
        addResponsible,
        updateResponsible,
        deleteResponsible,
        updateCompanyLogo,
        getClientsByCompanyId
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
