
import React, { createContext, useContext } from 'react';
import { Company, Client, Responsible } from '@/lib/types';
import { mockClients, mockResponsibles } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { useCompanyState } from '@/hooks/use-company-state';
import { useCompanyOperations } from '@/hooks/use-company-operations';
import { supabase, convertToUUID } from '@/integrations/supabase/client';

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

  // Carrega clientes do localStorage ou Supabase
  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        // Tenta buscar clientes do Supabase
        const { data, error } = await supabase
          .from('clients')
          .select('*');
          
        if (error) {
          console.error("Erro ao buscar clientes do Supabase:", error);
          
          // Tenta buscar clientes do localStorage como fallback
          const storedClients = localStorage.getItem('clients');
          if (storedClients) {
            setClients(JSON.parse(storedClients));
          }
        } else if (data && data.length > 0) {
          // Mapeia os dados do Supabase para o formato local
          const formattedClients = data.map(c => ({
            id: c.id,
            name: c.name,
            email: c.contact_email || undefined,
            phone: c.contact_phone || undefined,
            address: undefined,
            cnpj: undefined,
            companyId: c.company_id || '',
            createdAt: new Date(c.created_at || new Date()),
            updatedAt: new Date(c.updated_at || new Date())
          }));
          
          console.log("Clientes carregados do Supabase:", formattedClients);
          setClients(formattedClients);
        }
      } catch (error) {
        console.error("Erro ao inicializar clientes:", error);
      }
    };
    
    fetchClients();
  }, []);

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

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!company) return;
    
    try {
      console.log("Adicionando novo cliente:", clientData);
      
      // Ensure we have a valid company ID
      const companyId = clientData.companyId || company.id;
      console.log("ID da empresa original:", companyId);
      
      const supabaseCompanyId = convertToUUID(companyId);
      console.log("ID da empresa convertido para UUID:", supabaseCompanyId);
      
      if (!supabaseCompanyId) {
        throw new Error("ID da empresa inválido");
      }
      
      // Primeiro tenta salvar no Supabase
      const { data: supabaseClient, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          contact_email: clientData.email,
          contact_phone: clientData.phone,
          company_id: supabaseCompanyId
        })
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao salvar cliente no Supabase:", error);
        
        // Fallback para salvar localmente em caso de erro
        const newClient: Client = {
          id: Date.now().toString(),
          companyId: companyId,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...clientData
        };
        
        setClients(prev => [...prev, newClient]);
        
        toastUI({
          title: "Cliente adicionado localmente",
          description: `Cliente ${clientData.name} foi adicionado localmente.`,
          variant: "default",
        });
      } else {
        // Cliente salvo com sucesso no Supabase
        console.log("Cliente salvo no Supabase:", supabaseClient);
        
        // Mapeia o cliente do Supabase para o formato local
        const newClient: Client = {
          id: supabaseClient.id,
          name: supabaseClient.name,
          email: supabaseClient.contact_email || undefined,
          phone: supabaseClient.contact_phone || undefined,
          address: undefined,
          cnpj: undefined,
          companyId: companyId, // Mantenha o ID original para correlações locais
          createdAt: new Date(supabaseClient.created_at || new Date()),
          updatedAt: new Date(supabaseClient.updated_at || new Date())
        };
        
        // Atualiza o estado local
        setClients(prev => [...prev, newClient]);
        
        toastUI({
          title: "Cliente adicionado",
          description: `Cliente ${clientData.name} foi adicionado com sucesso.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      
      // Fallback de segurança em caso de erro
      const newClient: Client = {
        id: Date.now().toString(),
        companyId: clientData.companyId || company.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...clientData
      };
      
      setClients(prev => [...prev, newClient]);
      
      toastUI({
        title: "Erro ao salvar",
        description: "Cliente salvo localmente, mas ocorreu um erro com o banco de dados.",
        variant: "destructive",
      });
    }
  };

  const updateClient = (updatedClient: Client) => {
    if (!company) return;
    
    const updatedClients = clients.map(c => 
      c.id === updatedClient.id ? { ...updatedClient, updatedAt: new Date() } : c
    );
    
    setClients(updatedClients);
    
    toast.success("Cliente atualizado com sucesso!");
  };

  const deleteClient = (id: string) => {
    if (!company) return;
    
    setClients(clients.filter(c => c.id !== id));
    
    toast.success("Cliente excluído com sucesso!");
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
    console.log("Buscando clientes para a empresa:", companyId);
    console.log("Total de clientes disponíveis:", clients.length);
    
    // Filtrar clientes pela companyId
    const filteredClients = clients.filter(client => {
      const clientBelongsToCompany = client.companyId === companyId;
      if (clientBelongsToCompany) {
        console.log("Cliente encontrado para a empresa:", client);
      }
      return clientBelongsToCompany;
    });
    
    console.log("Clientes filtrados para a empresa:", filteredClients.length);
    return filteredClients;
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
