
import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  cpf: z.string().min(1, 'CPF é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

const LoginPage = () => {
  const { isAuthenticated, login, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cpf: '802.430.881-91', // Pre-fill with master user CPF
      password: '@54321', // Pre-fill with default password for easier testing
    },
  });

  // Função para formatar CPF automaticamente (XXX.XXX.XXX-XX)
  const formatCPF = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedValue = digits;
    
    if (digits.length > 3) {
      formattedValue = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    if (digits.length > 6) {
      formattedValue = `${formattedValue.slice(0, 7)}.${formattedValue.slice(7)}`;
    }
    if (digits.length > 9) {
      formattedValue = `${formattedValue.slice(0, 11)}-${formattedValue.slice(11, 13)}`;
    }
    
    return formattedValue.slice(0, 14); // Limita ao tamanho máximo de um CPF formatado
  }, []);

  // Handler para atualizar o campo CPF formatado
  const handleCPFChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    form.setValue('cpf', formatted);
    setLoginError(null); // Clear any error when user changes input
  }, [form, formatCPF]);

  // Foco automático no campo CPF ao carregar a página
  useEffect(() => {
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
      cpfInput.focus();
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setLoginError(null);
    
    try {
      // Limpar o CPF de qualquer formatação (pontos, traços)
      const cleanedCpf = data.cpf.replace(/\D/g, '');
      console.log(`Tentando login com CPF limpo: ${cleanedCpf}, senha: ${data.password.substring(0, 1)}${'*'.repeat(data.password.length - 1)}`);
      
      // Special handling for master user
      if (cleanedCpf === '80243088191' && data.password === '@54321') {
        console.log("Login direto com usuário master");
        
        try {
          // Try to login to Supabase first with admin email
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@totaldata.com.br',
            password: data.password,
          });
          
          if (signInError) {
            console.log("Tentando criar conta de admin no Supabase:", signInError);
            
            // If login fails, create the admin user in Supabase
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: 'admin@totaldata.com.br',
              password: data.password,
              options: {
                data: {
                  cpf: cleanedCpf,
                  name: 'Administrador Master',
                  role: 'master',
                }
              }
            });
            
            if (signUpError && signUpError.message !== "User already registered") {
              console.error("Erro ao criar usuário master no Supabase:", signUpError);
              throw new Error(`Erro de autenticação: ${signUpError.message}`);
            } else {
              console.log("Usuário master criado/já existe no Supabase");
              
              // Try login again after signup
              const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
                email: 'admin@totaldata.com.br',
                password: data.password,
              });
              
              if (retrySignInError) {
                console.error("Erro de login após criação:", retrySignInError);
                // Continue with local auth even if Supabase auth fails
              }
            }
          }
          
          // Force login for master user in localStorage
          localStorage.setItem('userAuthenticated', 'true');
          localStorage.setItem('userRole', 'master');
          localStorage.setItem('userCPF', cleanedCpf);
          localStorage.setItem('userName', 'Administrador Master');
          
          toast.success("Login bem-sucedido", {
            description: "Você foi autenticado com sucesso como Administrador Master"
          });
          
          // Use window.location.replace instead of window.location.href
          window.location.replace('/dashboard');
          return;
        } catch (e: any) {
          console.error("Erro ao interagir com Supabase:", e);
          
          // Even if Supabase interaction fails, proceed with localStorage auth for master user
          localStorage.setItem('userAuthenticated', 'true');
          localStorage.setItem('userRole', 'master');
          localStorage.setItem('userCPF', cleanedCpf);
          localStorage.setItem('userName', 'Administrador Master');
          
          toast.success("Login bem-sucedido", {
            description: "Você foi autenticado com sucesso como Administrador Master (modo local)"
          });
          
          window.location.replace('/dashboard');
          return;
        }
      }
      
      // Regular user login flow
      const success = await login(cleanedCpf, data.password);
      
      if (!success) {
        console.error("Falha no login");
        setLoginError("CPF ou senha incorretos. Por favor, verifique suas credenciais.");
        toast.error("Erro no login", {
          description: "CPF ou senha incorretos"
        });
      } else {
        console.log("Login bem-sucedido");
        toast.success("Login bem-sucedido", {
          description: "Você foi autenticado com sucesso"
        });
        
        // Use replace instead of href for better navigation
        window.location.replace('/dashboard');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setLoginError(error.message || "Ocorreu um erro durante o login. Tente novamente.");
      toast.error("Erro no login", {
        description: error.message || "Ocorreu um erro durante o login. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    console.log("Usuário autenticado, redirecionando para a home");
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/daf5142a-3bdb-4bbb-b2b2-09f3f7b3b87f.png" 
            alt="Total Data Logo" 
            className="h-24" 
          />
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Gerenciador de Ações</CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais abaixo para fazer login
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input 
                          id="cpf" 
                          placeholder="Digite seu CPF" 
                          {...field} 
                          onChange={(e) => handleCPFChange(e)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Digite sua senha" {...field} />
                      </FormControl>
                      <FormDescription>
                        A senha padrão é @54321
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading || authLoading}>
                  {loading || authLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="text-center text-xs text-gray-500 mt-4">
              © {new Date().getFullYear()} Total Data - Todos os direitos reservados
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
