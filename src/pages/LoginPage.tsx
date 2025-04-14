
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
        const { data, error } = await supabase.rpc('check_master_user_exists');
        
        if (error) {
          console.error('Erro ao verificar usuário master:', error);
        } else {
          setMasterUserExists(!!data);
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
      
      // Usar RPC para buscar o usuário pelo CPF para obter o email
      const { data: userEmail, error: rpcError } = await supabase.rpc('get_user_email_by_cpf', {
        cpf_param: normalizedCPF
      });
      
      if (rpcError) {
        console.error('Erro ao buscar email do usuário:', rpcError);
        toast.error("Erro ao buscar informações de usuário", {
          description: rpcError.message
        });
        setLoading(false);
        return;
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
      
      // Usar RPC para verificar se já existe um usuário com este CPF
      const { data: userExists, error: rpcError } = await supabase.rpc('check_user_exists_by_cpf', {
        cpf_param: normalizedCPF
      });
      
      if (rpcError) {
        console.error('Erro ao verificar usuário existente:', rpcError);
        throw new Error("Erro ao verificar se o usuário já existe");
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
      // Criar usuário no Auth com senha @54321
      const { data: authData, error: authError } = await supabase.functions.invoke('create-master-user', {
        body: {
          email: 'fabiano@totalseguranca.net',
          password: '@54321',
          name: 'Administrador Master',
          cpf: '80243088191'
        }
      });
      
      if (authError) {
        console.error('Erro ao criar usuário master:', authError);
        toast.error("Erro", {
          description: authError.message || "Erro ao criar usuário master"
        });
        return;
      }
      
      if (!authData.success) {
        toast.error("Erro", {
          description: authData.message || "Falha ao criar usuário master"
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
