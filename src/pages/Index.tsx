
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

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
