import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  cpf: z.string().min(1, 'CPF é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface RPCResponse<T> {
  data: T;
  error: any;
}

interface CheckMasterUserExistsParams {}
interface GetUserEmailByCpfParams {
  cpf_param: string;
}
interface CheckUserExistsByCpfParams {
  cpf_param: string;
}

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [creatingMaster, setCreatingMaster] = useState(false);
  const [masterUserExists, setMasterUserExists] = useState(false);
  const [checkingMaster, setCheckingMaster] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cpf: '',
      password: '',
    },
  });

  useEffect(() => {
    const checkMasterUser = async () => {
      try {
        setCheckingMaster(true);

        const { error: functionCheckError } = await supabase.functions.invoke<{ error: any }>(
          'check_master_user_exists', 
          { 
            body: {} as CheckMasterUserExistsParams 
          }
        );

        if (functionCheckError) {
          console.error('Erro ao verificar função RPC:', functionCheckError);
          
          const { data: masterUsers, error: queryError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'master')
            .limit(1);
            
          if (queryError) {
            console.error('Erro ao consultar usuários master:', queryError);
          } else {
            setMasterUserExists(masterUsers !== null && masterUsers.length > 0);
          }
        } else {
          const response = await supabase.functions.invoke<{ data: boolean; error: any }>(
            'check_master_user_exists',
            { 
              body: {} as CheckMasterUserExistsParams 
            }
          );
          
          if (response.error) {
            console.error('Erro ao verificar usuário master:', response.error);
          } else {
            setMasterUserExists(!!response.data);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar usuário master:', error);
      } finally {
        setCheckingMaster(false);
      }
    };
    
    checkMasterUser();
  }, []);

  useEffect(() => {
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
      cpfInput.focus();
    }
  }, []);

  const normalizeCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      const normalizedCPF = normalizeCPF(data.cpf);
      
      const { error: functionCheckError } = await supabase.functions.invoke<{ error: any }>(
        'get_user_email_by_cpf', 
        { 
          body: { cpf_param: normalizedCPF } as GetUserEmailByCpfParams 
        }
      );
      
      let userEmail: string | null = null;
      
      if (functionCheckError) {
        console.error('Error checking RPC function:', functionCheckError);
        
        const { data: userProfile, error: queryError } = await supabase
          .from('profiles')
          .select('email')
          .eq('cpf', normalizedCPF)
          .maybeSingle();
          
        if (queryError) {
          console.error('Error fetching user email:', queryError);
          throw new Error("Error fetching user information");
        }
        
        userEmail = userProfile?.email || null;
      } else {
        const response = await supabase.functions.invoke<{ data: string; error: any }>(
          'get_user_email_by_cpf',
          { 
            body: { cpf_param: normalizedCPF } as GetUserEmailByCpfParams 
          }
        );
        
        if (response.error) {
          console.error('Error fetching user email:', response.error);
          throw new Error("Error fetching user information");
        }
        
        userEmail = response.data ?? null;
      }
      
      if (!userEmail) {
        toast.error("Usuário não encontrado", {
          description: "CPF não cadastrado no sistema"
        });
        setLoading(false);
        return;
      }
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: data.password,
      });
      
      if (error) {
        console.error('Erro no login:', error);
        toast.error("Erro no login", {
          description: error.message || "CPF ou senha incorretos"
        });
        setLoading(false);
        return;
      }
      
      if (authData.user) {
        toast.success("Login bem-sucedido", {
          description: "Você foi autenticado com sucesso"
        });
      } else {
        toast.error("Erro no login", {
          description: "CPF ou senha incorretos"
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("Login error", {
        description: error.message || "An error occurred during login. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const cpf = form.getValues('cpf');
    const password = form.getValues('password');
    const email = `${normalizeCPF(cpf)}@exemplo.com`;
    
    if (!cpf || !password) {
      toast.error("Campos obrigatórios", {
        description: "Preencha o CPF e a senha para criar uma conta"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const normalizedCPF = normalizeCPF(cpf);
      
      const { error: functionCheckError } = await supabase.functions.invoke<{ error: any }>(
        'check_user_exists_by_cpf', 
        { 
          body: { cpf_param: normalizedCPF } as CheckUserExistsByCpfParams 
        }
      );
      
      let userExists = false;
      
      if (functionCheckError) {
        console.error('Error checking RPC function:', functionCheckError);
        
        const { data: existingUsers, error: queryError } = await supabase
          .from('profiles')
          .select('id')
          .eq('cpf', normalizedCPF)
          .limit(1);
          
        if (queryError) {
          console.error('Error checking user existence:', queryError);
          throw new Error("Error checking if user already exists");
        }
        
        userExists = existingUsers !== null && existingUsers.length > 0;
      } else {
        const response = await supabase.functions.invoke<{ data: boolean; error: any }>(
          'check_user_exists_by_cpf',
          { 
            body: { cpf_param: normalizedCPF } as CheckUserExistsByCpfParams 
          }
        );
        
        if (response.error) {
          console.error('Error checking user existence:', response.error);
          throw new Error("Error checking if user already exists");
        }
        
        userExists = !!response.data;
      }
      
      if (userExists) {
        toast.error("Usuário já existe", {
          description: "Já existe um usuário com este CPF"
        });
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: cpf,
            cpf: normalizedCPF
          }
        }
      });
      
      if (error) {
        console.error('Erro no cadastro:', error);
        throw error;
      }
      
      if (data.user) {
        toast.success("Cadastro realizado", {
          description: "Uma verificação será enviada para o administrador aprovar seu cadastro"
        });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error("Erro no cadastro", {
        description: error.message || "Ocorreu um erro durante o cadastro. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const createMasterUser = async () => {
    setCreatingMaster(true);
    try {
      console.log("Iniciando criação de usuário master");
      
      const response = await supabase.functions.invoke('create-master-user', {
        body: {
          email: 'fabiano@totalseguranca.net',
          password: '@54321',
          name: 'Administrador Master',
          cpf: '80243088191'
        }
      });
      
      console.log("Resposta da função:", response);
      
      if (response.error) {
        console.error('Erro ao criar usuário master:', response.error);
        toast.error("Erro", {
          description: response.error.message || "Erro ao criar usuário master"
        });
        return;
      }
      
      if (!response.data?.success) {
        toast.error("Erro", {
          description: response.data?.message || "Falha ao criar usuário master"
        });
        return;
      }
      
      toast.success("Usuário Master criado", {
        description: "O usuário master foi criado com sucesso com CPF: 80243088191 e senha: @54321"
      });
      
      setMasterUserExists(true);
      
      form.setValue('cpf', '80243088191');
      form.setValue('password', '@54321');
      
    } catch (error: any) {
      console.error('Erro ao criar usuário master:', error);
      toast.error("Erro", {
        description: error.message || "Erro ao criar usuário master"
      });
    } finally {
      setCreatingMaster(false);
    }
  };

  const createDirectAdminUser = async () => {
    setLoading(true);
    try {
      const normalizedCPF = '80243088191';
      const email = `${normalizedCPF}@exemplo.com`;
      
      const { data: existingUser, error: queryError } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', normalizedCPF)
        .maybeSingle();
        
      if (queryError) {
        console.error('Erro ao verificar usuário existente:', queryError);
        toast.error("Erro", {
          description: "Erro ao verificar se o usuário já existe"
        });
        setLoading(false);
        return;
      }
      
      if (existingUser) {
        toast.success("Usuário já existe", {
          description: "Use CPF: 80243088191 e senha: @54321 para fazer login"
        });
        
        form.setValue('cpf', '80243088191');
        form.setValue('password', '@54321');
        
        setLoading(false);
        return;
      }
      
      const response = await supabase.functions.invoke('create-admin-user');
      
      if (response.error) {
        console.error('Erro ao criar usuário administrador:', response.error);
        toast.error("Erro", {
          description: response.error.message || "Erro ao criar usuário administrador"
        });
        setLoading(false);
        return;
      }
      
      const responseData = response.data as any;
      const success = responseData?.success;
      const message = responseData?.message || "Operação concluída";
      
      if (success) {
        toast.success("Usuário criado com sucesso", {
          description: message
        });
        
        form.setValue('cpf', '80243088191');
        form.setValue('password', '@54321');
        setMasterUserExists(true);
      } else {
        toast.error("Erro", {
          description: message
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error("Erro", {
        description: error.message || "Erro ao criar usuário"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input id="cpf" placeholder="Digite seu CPF" {...field} />
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
                        A senha deve ter pelo menos 6 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : 'Entrar'}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={handleSignUp} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : 'Criar Conta'}
                  </Button>
                </div>
              </form>
            </Form>
            
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col gap-2">
              {!masterUserExists && !checkingMaster && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs" 
                  onClick={createMasterUser}
                  disabled={creatingMaster || loading}
                >
                  {creatingMaster ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Criando usuário master...
                    </>
                  ) : 'Criar usuário master (CPF: 80243088191)'}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs" 
                onClick={createDirectAdminUser}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Criando usuário administrador...
                  </>
                ) : 'Criar usuário administrador (CPF: 80243088191)'}
              </Button>
            </div>
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
