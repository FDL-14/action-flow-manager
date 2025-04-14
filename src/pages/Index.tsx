
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { companies } = useCompany();

  // Check user's session to determine redirection
  useEffect(() => {
    const handleRedirection = () => {
      if (isAuthenticated) {
        console.log("Usuário autenticado, redirecionando para o dashboard");
        navigate('/dashboard');
      } else {
        console.log("Usuário não autenticado, redirecionando para o login");
        navigate('/login');
      }
    };

    // Add a small delay to ensure data is loaded
    const timer = setTimeout(() => {
      handleRedirection();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [isAuthenticated, navigate]);

  // Initialize the database when needed
  useEffect(() => {
    const initializeData = async () => {
      if (companies && companies.length === 0) {
        try {
          // Check if there are companies in the database
          const { data: existingCompanies, error: companyError } = await supabase
            .from('companies')
            .select('id')
            .limit(1);
            
          if (companyError) {
            console.error("Erro ao verificar empresas:", companyError);
            return;
          }
          
          // Create default company if none exists
          if (!existingCompanies || existingCompanies.length === 0) {
            const { error } = await supabase
              .from('companies')
              .insert({
                name: 'Total Data',
                address: 'São Paulo, SP',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (error) {
              console.error("Erro ao criar empresa padrão:", error);
              toast.error("Erro na inicialização", {
                description: "Não foi possível criar a empresa padrão."
              });
            } else {
              console.log("Empresa padrão criada com sucesso");
            }
          }
        } catch (error) {
          console.error("Erro na inicialização:", error);
          toast.error("Erro na inicialização", {
            description: "Ocorreu um erro ao inicializar dados."
          });
        }
      }
    };
    
    initializeData();
  }, [companies]);

  return null; // This page only redirects
};

export default Index;
