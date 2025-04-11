
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
    try {
      // Carregar empresa do localStorage
      const savedCompany = localStorage.getItem('company');
      if (savedCompany) {
        const parsedCompany = JSON.parse(savedCompany);
        if (parsedCompany && parsedCompany.id) {
          console.log("Carregando empresa do localStorage");
          setCompanyState(parsedCompany);
        } else {
          console.log("Dados de empresa inválidos no localStorage, usando dados padrão");
          setCompanyState(defaultCompany);
          localStorage.setItem('company', JSON.stringify(defaultCompany));
        }
      } else {
        console.log("Nenhuma empresa encontrada no localStorage, usando dados padrão");
        setCompanyState(defaultCompany);
        localStorage.setItem('company', JSON.stringify(defaultCompany));
      }

      // Carregar clientes do localStorage
      const savedClients = localStorage.getItem('clients');
      if (savedClients) {
        const parsedClients = JSON.parse(savedClients);
        if (Array.isArray(parsedClients) && parsedClients.length > 0) {
          console.log("Carregando clientes do localStorage:", parsedClients.length);
          setClients(parsedClients);
        } else {
          console.log("Dados de clientes inválidos no localStorage, usando dados mock");
          setClients(mockClients);
          localStorage.setItem('clients', JSON.stringify(mockClients));
        }
      } else {
        console.log("Nenhum cliente encontrado no localStorage, usando dados mock");
        setClients(mockClients);
        localStorage.setItem('clients', JSON.stringify(mockClients));
      }

      // Carregar responsáveis do localStorage - MELHORADO para evitar sumir
      const savedResponsibles = localStorage.getItem('responsibles');
      if (savedResponsibles) {
        try {
          const parsedResponsibles = JSON.parse(savedResponsibles);
          if (Array.isArray(parsedResponsibles) && parsedResponsibles.length > 0) {
            console.log("Carregando responsáveis do localStorage:", parsedResponsibles.length);
            setResponsibles(parsedResponsibles);
          } else {
            console.log("Dados de responsáveis inválidos no localStorage, usando dados mock");
            setResponsibles(mockResponsibles);
            localStorage.setItem('responsibles', JSON.stringify(mockResponsibles));
          }
        } catch (parseError) {
          console.error("Erro ao analisar responsáveis do localStorage:", parseError);
          setResponsibles(mockResponsibles);
          localStorage.setItem('responsibles', JSON.stringify(mockResponsibles));
          toast({
            title: "Erro de dados",
            description: "Dados de responsáveis corrompidos. Carregando dados padrão.",
            variant: "destructive",
          });
        }
      } else {
        console.log("Nenhum responsável encontrado no localStorage, usando dados mock");
        setResponsibles(mockResponsibles);
        localStorage.setItem('responsibles', JSON.stringify(mockResponsibles));
      }
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error);
      toast({
        title: "Erro de dados",
        description: "Houve um problema ao carregar os dados da empresa. Usando dados padrão.",
        variant: "destructive",
      });
      
      // Usar dados padrão em caso de erro
      setCompanyState(defaultCompany);
      setClients(mockClients);
      setResponsibles(mockResponsibles);
      
      // Salvar dados padrão no localStorage
      localStorage.setItem('company', JSON.stringify(defaultCompany));
      localStorage.setItem('clients', JSON.stringify(mockClients));
      localStorage.setItem('responsibles', JSON.stringify(mockResponsibles));
    }
  }, [toast]);

  // Salvar clientes no localStorage sempre que forem alterados
  useEffect(() => {
    try {
      if (clients && clients.length > 0) {
        console.log("Salvando clientes no localStorage:", clients.length);
        localStorage.setItem('clients', JSON.stringify(clients));
      }
    } catch (error) {
      console.error("Erro ao salvar clientes no localStorage:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os clientes localmente.",
        variant: "destructive",
      });
    }
  }, [clients, toast]);

  // Salvar responsáveis no localStorage sempre que forem alterados - MELHORADO
  useEffect(() => {
    try {
      if (responsibles && responsibles.length > 0) {
        console.log("Salvando responsáveis no localStorage:", responsibles.length);
        
        // Criar uma cópia dos dados para evitar problemas de referência circular
        const responsiblesData = JSON.parse(JSON.stringify(responsibles));
        
        // Salvar em localStorage
        localStorage.setItem('responsibles', JSON.stringify(responsiblesData));
        
        // Verificar se o salvamento foi bem-sucedido
        const savedData = localStorage.getItem('responsibles');
        if (!savedData) {
          throw new Error("Falha ao salvar responsáveis: não foi possível ler após salvar");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar responsáveis no localStorage:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os responsáveis localmente.",
        variant: "destructive",
      });
    }
  }, [responsibles, toast]);

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
      id: Date.now().toString(), // Usando timestamp como ID para evitar colisões
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
      id: Date.now().toString(), // Usando timestamp como ID para evitar colisões
      companyId: company.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...responsibleData
    };
    
    const updatedResponsibles = [...responsibles, newResponsible];
    setResponsibles(updatedResponsibles);
    
    try {
      // Salvar imediatamente para garantir persistência
      localStorage.setItem('responsibles', JSON.stringify(updatedResponsibles));
      
      toast({
        title: "Responsável adicionado",
        description: `${responsibleData.name} foi adicionado(a) com sucesso como responsável.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast({
        title: "Erro ao salvar",
        description: "O responsável foi adicionado, mas houve um problema ao salvar localmente.",
        variant: "destructive",
      });
    }
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
