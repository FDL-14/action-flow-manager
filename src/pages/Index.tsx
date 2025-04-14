
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { additionalCompanies, additionalUsers, defaultMasterUser } from '@/lib/mock-data';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, users, addUser } = useAuth();
  const { companies, addCompany } = useCompany();

  // Função para inicializar os dados de exemplo
  useEffect(() => {
    const initializeDefaultData = async () => {
      try {
        console.log("Inicializando dados padrão...");
        
        // Verificar e adicionar empresas adicionais
        if (companies) {
          console.log(`Total de empresas existentes: ${companies.length}`);
          
          // Verificar cada empresa adicional
          for (const company of additionalCompanies) {
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

        // Verificar e adicionar usuário master padrão se não existir
        if (users) {
          console.log(`Total de usuários existentes: ${users.length}`);
          
          const normalizedMasterCPF = defaultMasterUser.cpf.replace(/\D/g, '');
          
          // Verificar se já existe usuário com este CPF
          const existingMasterUser = users.find(u => u.cpf.replace(/\D/g, '') === normalizedMasterCPF);
          
          if (!existingMasterUser) {
            console.log(`Adicionando usuário master ${defaultMasterUser.name} (CPF: ${defaultMasterUser.cpf}) ao localStorage`);
            await addUser({
              name: defaultMasterUser.name,
              cpf: defaultMasterUser.cpf,
              email: defaultMasterUser.email,
              role: defaultMasterUser.role,
              companyIds: defaultMasterUser.companyIds,
              permissions: defaultMasterUser.permissions[0]
            });
          } else {
            console.log(`Usuário master ${defaultMasterUser.name} já existe no localStorage (ID: ${existingMasterUser.id})`);
          }
          
          // Verificar e adicionar usuários adicionais
          for (const userToAdd of additionalUsers) {
            // Normaliza CPFs para comparação
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
                permissions: userToAdd.permissions[0]
              });
            } else {
              console.log(`Usuário ${userToAdd.name} já existe no localStorage`);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar dados padrão:", error);
        toast.error("Erro na inicialização", {
          description: "Ocorreu um erro ao carregar dados iniciais."
        });
      }
    };

    // Executa a inicialização de dados
    initializeDefaultData();
  }, [companies, users, addCompany, addUser]);

  useEffect(() => {
    const handleRedirection = () => {
      if (isAuthenticated) {
        // Se autenticado, vai para o dashboard
        console.log("Usuário autenticado, redirecionando para o dashboard");
        navigate('/dashboard');
      } else {
        // Para acesso não autenticado, redirecionar para login
        console.log("Usuário não autenticado, redirecionando para o login");
        navigate('/login');
      }
    };

    // Executa o redirecionamento
    handleRedirection();

    // Adicionar um listener para o evento storage para sincronização entre abas
    const handleStorageChange = () => {
      console.log("Alteração no localStorage detectada, recarregando dados");
      handleRedirection();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, navigate]);

  return null; // Esta página apenas redireciona
};

export default Index;
