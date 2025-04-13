
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { additionalCompanies, additionalUsers } from '@/lib/mock-data';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, users, addUser } = useAuth();
  const { companies, addCompany } = useCompany();

  // Função para inicializar os dados de exemplo
  useEffect(() => {
    const initializeDefaultData = async () => {
      try {
        // Verificar e adicionar empresas adicionais
        if (companies && additionalCompanies) {
          for (const company of additionalCompanies) {
            if (!companies.some(c => c.id === company.id)) {
              console.log(`Adicionando empresa ${company.name} ao localStorage`);
              addCompany({
                name: company.name,
                address: company.address,
                cnpj: company.cnpj,
                phone: company.phone,
                createdAt: company.createdAt,
                updatedAt: company.updatedAt
              });
            }
          }
        }

        // Verificar e adicionar usuários adicionais
        if (users && additionalUsers) {
          for (const userToAdd of additionalUsers) {
            // Normaliza CPFs para comparação
            const normalizedCPFs = users.map(u => u.cpf.replace(/\D/g, ''));
            const normalizedCpf = userToAdd.cpf.replace(/\D/g, '');
            
            if (!normalizedCPFs.includes(normalizedCpf)) {
              console.log(`Adicionando usuário ${userToAdd.name} ao localStorage`);
              await addUser({
                name: userToAdd.name,
                cpf: userToAdd.cpf,
                email: userToAdd.email,
                role: userToAdd.role,
                companyIds: userToAdd.companyIds,
                clientIds: userToAdd.clientIds,
                permissions: userToAdd.permissions[0]
              });
            }
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar dados padrão:", error);
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
        // Para acesso público, permitir entrada com aviso de visitante
        console.log("Acesso como visitante, redirecionando para o dashboard");
        toast.info("Acesso como visitante", {
          description: "Você está acessando o sistema como visitante. Algumas funcionalidades podem ser limitadas.",
          duration: 5000,
        });
        
        // Redireciona para o login em vez do dashboard quando não autenticado
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
