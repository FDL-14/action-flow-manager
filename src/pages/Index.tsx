
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Routing logic with better handling for remote access
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Para acesso público, permitimos entrar sem login, mas com aviso
      toast.info("Acesso como visitante", {
        description: "Você está acessando o sistema como visitante. Algumas funcionalidades podem ser limitadas.",
        duration: 5000,
      });
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return null; // This page only redirects
};

export default Index;
