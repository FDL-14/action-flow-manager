import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { additionalCompanies, additionalUsers, defaultMasterUser } from '@/lib/mock-data';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, users, addUser } = useAuth();
  const { companies, addCompany } = useCompany();

  // Check if Supabase is connected
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.from('actions').select('count').limit(1);
        
        if (error) {
          console.error('Erro ao conectar ao Supabase:', error);
          toast.error('Erro de conexão com o banco de dados', {
            description: 'Utilizando modo offline. Algumas funcionalidades podem estar indisponíveis.'
          });
        } else {
          console.log('Conectado ao Supabase com sucesso!');
          toast.success('Conectado ao banco de dados', {
            description: 'Sistema online. Todas as mudanças serão sincronizadas.'
          });
        }
      } catch (error) {
        console.error('Erro ao verificar conexão com Supabase:', error);
      }
    };
    
    checkSupabaseConnection();
  }, []);

  // Function to initialize default data - modified to check if already initialized
  useEffect(() => {
    // Check if data has already been initialized
    const alreadyInitialized = localStorage.getItem('data_initialized');
    
    const initializeDefaultData = async () => {
      // If data was already initialized, do nothing
      if (alreadyInitialized === 'true') {
        console.log("Dados já foram inicializados anteriormente, pulando inicialização");
        return;
      }
      
      try {
        console.log("Inicializando dados padrão...");
        
        // Check and add additional companies
        if (companies) {
          console.log(`Total de empresas existentes: ${companies.length}`);
          
          // Check each additional company
          for (const company of additionalCompanies) {
            // Check if company with this ID already exists
            if (!companies.some(c => c.id === company.id)) {
              console.log(`Adicionando empresa ${company.name} (ID: ${company.id}) ao localStorage`);
              addCompany({
                name: company.name,
                address: company.address,
                cnpj: company.cnpj,
                phone: company.phone,
                createdAt: company.createdAt,
                updatedAt: company.updatedAt
              });
            } else {
              console.log(`Empresa ${company.name} já existe no localStorage`);
            }
          }
        }

        // Check and add default master user if it doesn't exist
        if (users) {
          console.log(`Total de usuários existentes: ${users.length}`);
          
          const normalizedMasterCPF = defaultMasterUser.cpf.replace(/\D/g, '');
          
          // Check if user with this CPF already exists
          const existingMasterUser = users.find(u => u.cpf.replace(/\D/g, '') === normalizedMasterCPF);
          
          if (!existingMasterUser) {
            console.log(`Adicionando usuário master ${defaultMasterUser.name} (CPF: ${defaultMasterUser.cpf}) ao localStorage`);
            await addUser({
              name: defaultMasterUser.name,
              cpf: defaultMasterUser.cpf,
              email: defaultMasterUser.email,
              role: defaultMasterUser.role,
              companyIds: defaultMasterUser.companyIds,
              permissions: defaultMasterUser.permissions
            });
          } else {
            console.log(`Usuário master ${defaultMasterUser.name} já existe no localStorage (ID: ${existingMasterUser.id})`);
          }
          
          // Check and add additional users
          for (const userToAdd of additionalUsers) {
            // Normalize CPFs for comparison
            const normalizedCPFs = users.map(u => u.cpf.replace(/\D/g, ''));
            const normalizedCpf = userToAdd.cpf.replace(/\D/g, '');
            
            if (!normalizedCPFs.includes(normalizedCpf)) {
              console.log(`Adicionando usuário ${userToAdd.name} (CPF: ${userToAdd.cpf}) ao localStorage`);
              await addUser({
                name: userToAdd.name,
                cpf: userToAdd.cpf,
                email: userToAdd.email,
                role: userToAdd.role,
                companyIds: userToAdd.companyIds,
                clientIds: userToAdd.clientIds,
                permissions: userToAdd.permissions
              });
            } else {
              console.log(`Usuário ${userToAdd.name} já existe no localStorage`);
            }
          }
        }
        
        // Mark as initialized after completion
        localStorage.setItem('data_initialized', 'true');
      } catch (error) {
        console.error("Erro ao inicializar dados padrão:", error);
        toast.error("Erro na inicialização", {
          description: "Ocorreu um erro ao carregar dados iniciais."
        });
      }
    };

    // Execute data initialization
    initializeDefaultData();
  }, [companies, users, addCompany, addUser]);

  useEffect(() => {
    const handleRedirection = () => {
      if (isAuthenticated) {
        // If autenticado, vai para o dashboard
        console.log("Usuário autenticado, redirecionando para o dashboard");
        navigate('/dashboard');
      } else {
        // Para acesso não autenticado, redirecionar para login
        console.log("Usuário não autenticado, redirecionando para o login");
        navigate('/login');
      }
    };

    // Add a small delay to ensure that data is loaded
    const timer = setTimeout(() => {
      handleRedirection();
    }, 500);

    // Add a listener for the storage event to synchronize between tabs
    const handleStorageChange = () => {
      console.log("Alteração no localStorage detectada, recarregando dados");
      handleRedirection();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, navigate]);

  return null; // This page just redirects
};

export default Index;
