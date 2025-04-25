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

  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*');
          
        if (error) {
          console.error("Erro ao buscar clientes do Supabase:", error);
          
          const storedClients = localStorage.getItem('clients');
          if (storedClients) {
            const parsedClients = JSON.parse(storedClients);
            console.log("Clientes carregados do localStorage:", parsedClients);
            setClients(parsedClients);
          }
        } else if (data && data.length > 0) {
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
        } else {
          // No clients found in Supabase, try loading from localStorage
          const storedClients = localStorage.getItem('clients');
          if (storedClients) {
            const parsedClients = JSON.parse(storedClients);
            console.log("Nenhum cliente no Supabase, carregando do localStorage:", parsedClients);
            setClients(parsedClients);
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar clientes:", error);
      }
    };
    
    fetchClients();
  }, []);

  // Save clients to localStorage when they change
  React.useEffect(() => {
    try {
      if (clients && clients.length > 0) {
        console.log("Salvando clientes no localStorage:", clients);
        localStorage.setItem('clients', JSON.stringify(clients));
      }
    } catch (error) {
      console.error("Error saving clients:", error);
      toast.error("Erro ao salvar clientes localmente");
    }
  }, [clients]);

  // Save responsibles to localStorage when they change
  React.useEffect(() => {
    try {
      if (responsibles && responsibles.length > 0) {
        localStorage.setItem('responsibles', JSON.stringify(responsibles));
      }
    } catch (error) {
      console.error("Error saving responsibles:", error);
      toast.error("Erro ao salvar responsáveis localmente");
    }
  }, [responsibles]);

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!clientData.companyId) {
      toast.error("Erro ao salvar cliente", {
        description: "É necessário selecionar uma empresa para este cliente."
      });
      return;
    }
    
    try {
      console.log("Adicionando cliente com dados:", clientData);
      
      // First check if the company exists in the list of companies
      const companyExists = companies.some(c => c.id === clientData.companyId);
      if (!companyExists) {
        toast.error("Empresa não encontrada", {
          description: "A empresa selecionada não existe."
        });
        return;
      }
      
      // Store original company ID for local state
      const originalCompanyId = clientData.companyId;
      
      // Convert company ID to UUID format for Supabase
      const companyId = convertToUUID(clientData.companyId);
      
      if (!companyId) {
        throw new Error("ID da empresa inválido");
      }
      
      const supabaseClientData = {
        name: clientData.name,
        contact_email: clientData.email || null,
        contact_phone: clientData.phone || null,
        contact_name: clientData.name,
        company_id: companyId
      };
      
      console.log("Dados a serem enviados para Supabase:", supabaseClientData);
      
      const { data: supabaseClient, error } = await supabase
        .from('clients')
        .insert(supabaseClientData)
        .select('*')
        .single();
      
      if (error) {
        console.error('Erro ao salvar cliente no Supabase:', error);
        throw error;
      }
      
      console.log("Cliente salvo no Supabase:", supabaseClient);
      
      // Important: Keep original companyId format for local state
      const newClient: Client = {
        id: supabaseClient.id,
        name: supabaseClient.name,
        email: supabaseClient.contact_email || undefined,
        phone: supabaseClient.contact_phone || undefined,
        address: undefined,
        cnpj: undefined,
        companyId: originalCompanyId, // Use original company ID to maintain consistency
        createdAt: new Date(supabaseClient.created_at),
        updatedAt: new Date(supabaseClient.updated_at)
      };
      
      console.log("Novo cliente adicionado ao estado local com companyId:", newClient.companyId);
      
      // Update local client list
      setClients(prev => [...prev, newClient]);
      
      toast.success("Cliente adicionado com sucesso!", {
        description: `Cliente ${clientData.name} foi adicionado com sucesso.`
      });
      
      return newClient;
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      toast.error("Erro ao salvar cliente", {
        description: "Não foi possível salvar o cliente. Por favor, tente novamente."
      });
      throw error;
    }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      console.log("Atualizando cliente:", updatedClient);
      
      if (!updatedClient.companyId) {
        toast.error("Erro ao atualizar cliente", {
          description: "É necessário selecionar uma empresa para este cliente."
        });
        return;
      }
      
      // Check if company exists in our companies list first
      const companyExists = companies.some(c => c.id === updatedClient.companyId);
      if (!companyExists) {
        toast.error("Empresa não encontrada", {
          description: "A empresa selecionada não existe."
        });
        return;
      }
      
      // Store original company ID for local state
      const originalCompanyId = updatedClient.companyId;
      
      // Make sure we have a valid company ID for the database
      const companyId = convertToUUID(updatedClient.companyId);
      
      if (!companyId) {
        throw new Error("ID da empresa inválido");
      }
      
      const supabaseClientData = {
        name: updatedClient.name,
        contact_email: updatedClient.email || null,
        contact_phone: updatedClient.phone || null,
        contact_name: updatedClient.name,
        company_id: companyId // Use the converted UUID for database
      };
      
      console.log("Enviando dados para Supabase:", supabaseClientData);
      
      const { error } = await supabase
        .from('clients')
        .update(supabaseClientData)
        .eq('id', updatedClient.id);
      
      if (error) {
        console.error('Erro ao atualizar cliente no Supabase:', error);
        throw error;
      }
      
      // Make sure we update the client in the state with the correct companyId
      const updatedClients = clients.map(c => 
        c.id === updatedClient.id ? { 
          ...updatedClient, 
          companyId: originalCompanyId, // Ensure we use the original format 
          updatedAt: new Date() 
        } : c
      );
      
      console.log("Cliente atualizado localmente com companyId:", originalCompanyId);
      setClients(updatedClients);
      
      toast.success("Cliente atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente", {
        description: "Não foi possível atualizar o cliente. Por favor, tente novamente."
      });
    }
  };

  const deleteClient = async (id: string) => {
    try {
      console.log("Excluindo cliente:", id);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir cliente no Supabase:', error);
        throw error;
      }
      
      setClients(clients.filter(c => c.id !== id));
      
      toast.success("Cliente excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente", {
        description: "Não foi possível excluir o cliente. Por favor, tente novamente."
      });
    }
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
    if (!companyId) {
      console.warn("getClientsByCompanyId: nenhum ID de empresa fornecido");
      return [];
    }
    
    if (companyId === 'all') {
      return clients;
    }
    
    console.log("Buscando clientes para a empresa:", companyId);
    console.log("Total de clientes disponíveis:", clients.length);
    console.log("IDs da empresa de cada cliente:", clients.map(c => ({ name: c.name, companyId: c.companyId })));
    
    // Ensure we're comparing with the exact same format
    const filteredClients = clients.filter(client => {
      if (!client.companyId) return false;
      
      // Normalize the comparison to ensure exact string matching
      const normalizedClientCompanyId = client.companyId.toString().trim();
      const normalizedTargetCompanyId = companyId.toString().trim();
      
      const isMatch = normalizedClientCompanyId === normalizedTargetCompanyId;
      console.log(`Cliente ${client.name}: companyId=${normalizedClientCompanyId}, target=${normalizedTargetCompanyId}, match=${isMatch}`);
      return isMatch;
    });
    
    console.log("Clientes filtrados para a empresa:", filteredClients);
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
