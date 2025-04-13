
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Consistent redirection logic for all access URLs
    if (isAuthenticated) {
      // If authenticated, go to dashboard
      navigate('/dashboard');
    } else {
      // For public access, allow entry with visitor warning
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
