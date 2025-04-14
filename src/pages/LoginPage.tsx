
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

// Corrigir a interface para tipagem genérica de retorno das funções RPC
interface RPCResponse<T> {
  data: T;
  error: any;
}

// Interfaces para os parâmetros das funções RPC
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

  // Verificar se o usuário master já existe ao carregar a página
  useEffect(() => {
    const checkMasterUser = async () => {
      try {
        setCheckingMaster(true);

        // Verificar se a função RPC existe e criar uma função PL/pgSQL temporária se não existir
        const { error: functionCheckError } = await supabase.functions.invoke<{ error: any }>(
          'check_master_user_exists', 
          { 
            body: {} as CheckMasterUserExistsParams 
          }
        );

        if (functionCheckError) {
          console.error('Erro ao verificar função RPC:', functionCheckError);
          
          // Verificar diretamente via consulta SQL se existem usuários master
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
          // A função RPC existe e foi executada com sucesso
          const { data, error } = await supabase.functions.invoke<{ data: boolean; error: any }>(
            'check_master_user_exists',
            { 
              body: {} as CheckMasterUserExistsParams 
            }
          );
          
          if (error) {
            console.error('Erro ao verificar usuário master:', error);
          } else {
            setMasterUserExists(!!data);
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

  // Foco automático no campo CPF ao carregar a página
  useEffect(() => {
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
      cpfInput.focus();
    }
  }, []);

  // Função para normalizar CPF (remover caracteres não numéricos)
  const normalizeCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      // Normalizar CPF antes de fazer a consulta
      const normalizedCPF = normalizeCPF(data.cpf);
      
      // Verificar se a função RPC existe
      const { error: functionCheckError } = await supabase.functions.invoke<{ error: any }>(
        'get_user_email_by_cpf', 
        { 
          body: { cpf_param: normalizedCPF } as GetUserEmailByCpfParams 
        }
      );
      
      let userEmail: string | null = null;
      
      if (functionCheckError) {
        console.error('Erro ao verificar função RPC:', functionCheckError);
        
        // Consulta alternativa se a função RPC não existir
        const { data: userProfile, error: queryError } = await supabase
          .from('profiles')
          .select('email')
          .eq('cpf', normalizedCPF)
          .maybeSingle();
          
        if (queryError) {
          console.error('Erro ao buscar email do usuário:', queryError);
          throw new Error("Erro ao buscar informações de usuário");
        }
        
        userEmail = userProfile?.email || null;
      } else {
        // A função RPC existe, usar normalmente
        const { data, error } = await supabase.functions.invoke<{ data: string; error: any }>(
          'get_user_email_by_cpf',
          { 
            body: { cpf_param: normalizedCPF } as GetUserEmailByCpfParams 
          }
        );
        
        if (error) {
          console.error('Erro ao buscar email do usuário:', error);
          throw new Error("Erro ao buscar informações de usuário");
        }
        
        // Fix: Extract the string data from the response
        userEmail = data || null;
      }
      
      if (!userEmail) {
        toast.error("Usuário não encontrado", {
          description: "CPF não cadastrado no sistema"
        });
        setLoading(false);
        return;
      }
      
      // Fazer login com o email obtido
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
      console.error('Erro no login:', error);
      toast.error("Erro no login", {
        description: error.message || "Ocorreu um erro durante o login. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const cpf = form.getValues('cpf');
    const password = form.getValues('password');
    const email = `${normalizeCPF(cpf)}@exemplo.com`; // Email gerado a partir do CPF
    
    if (!cpf || !password) {
      toast.error("Campos obrigatórios", {
        description: "Preencha o CPF e a senha para criar uma conta"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const normalizedCPF = normalizeCPF(cpf);
      
      // Verificar se a função RPC existe
      const { error: functionCheckError } = await supabase.functions.invoke<{ error: any }>(
        'check_user_exists_by_cpf', 
        { 
          body: { cpf_param: normalizedCPF } as CheckUserExistsByCpfParams 
        }
      );
      
      let userExists = false;
      
      if (functionCheckError) {
        console.error('Erro ao verificar função RPC:', functionCheckError);
        
        // Consulta alternativa se a função RPC não existir
        const { data: existingUsers, error: queryError } = await supabase
          .from('profiles')
          .select('id')
          .eq('cpf', normalizedCPF)
          .limit(1);
          
        if (queryError) {
          console.error('Erro ao verificar usuário existente:', queryError);
          throw new Error("Erro ao verificar se o usuário já existe");
        }
        
        userExists = existingUsers !== null && existingUsers.length > 0;
      } else {
        // A função RPC existe, usar normalmente
        const response = await supabase.functions.invoke<{ data: boolean; error: any }>(
          'check_user_exists_by_cpf',
          { 
            body: { cpf_param: normalizedCPF } as CheckUserExistsByCpfParams 
          }
        );
        
        if (response.error) {
          console.error('Erro ao verificar usuário existente:', response.error);
          throw new Error("Erro ao verificar se o usuário já existe");
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
            name: cpf, // Nome baseado no CPF
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
      console.error('Erro no cadastro:', error);
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
      
      // Criar usuário no Auth com senha @54321
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
      
      // Atualizar o estado para esconder o botão
      setMasterUserExists(true);
      
      // Preencher os campos de login com as credenciais do master
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
            
            {!masterUserExists && !checkingMaster && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs" 
                  onClick={createMasterUser}
                  disabled={creatingMaster}
                >
                  {creatingMaster ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Criando usuário master...
                    </>
                  ) : 'Criar usuário master (CPF: 80243088191)'}
                </Button>
              </div>
            )}
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
