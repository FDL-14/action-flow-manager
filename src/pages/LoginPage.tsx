
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
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [creatingMaster, setCreatingMaster] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Foco automático no campo Email ao carregar a página
  useEffect(() => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }
      
      if (authData.user) {
        toast.success("Login bem-sucedido", {
          description: "Você foi autenticado com sucesso"
        });
      } else {
        toast.error("Erro no login", {
          description: "Email ou senha incorretos"
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
    const email = form.getValues('email');
    const password = form.getValues('password');
    
    if (!email || !password) {
      toast.error("Campos obrigatórios", {
        description: "Preencha o email e a senha para criar uma conta"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0], // Nome baseado no email
          }
        }
      });
      
      if (error) {
        console.error('Erro no cadastro:', error);
        throw error;
      }
      
      if (data.user) {
        toast.success("Cadastro realizado", {
          description: "Verifique seu email para confirmar o cadastro"
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
      // Verificar se o usuário já existe
      const { data: existingUser, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'fabiano@totalseguranca.net')
        .maybeSingle();
      
      if (queryError) {
        console.error('Erro ao verificar usuário existente:', queryError);
        toast.error("Erro", {
          description: "Erro ao verificar se o usuário já existe"
        });
        setCreatingMaster(false);
        return;
      }
      
      if (existingUser) {
        toast.info("Usuário já existe", {
          description: "O usuário master já existe no sistema"
        });
        setCreatingMaster(false);
        return;
      }

      // Criar usuário no Auth com senha @54321
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'fabiano@totalseguranca.net',
        password: '@54321',
        email_confirm: true,
        user_metadata: {
          name: 'Administrador Master',
          cpf: '80243088191'
        }
      });
      
      if (authError) {
        console.error('Erro ao criar usuário master:', authError);
        toast.error("Erro", {
          description: authError.message || "Erro ao criar usuário master"
        });
        setCreatingMaster(false);
        return;
      }
      
      if (!authData.user) {
        toast.error("Erro", {
          description: "Falha ao criar usuário master"
        });
        setCreatingMaster(false);
        return;
      }
      
      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: 'Administrador Master',
          cpf: '80243088191',
          email: 'fabiano@totalseguranca.net',
          role: 'master',
          company_ids: ['1'],
          client_ids: []
        })
        .eq('id', authData.user.id);
      
      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        toast.error("Erro", {
          description: "Perfil criado, mas falha ao atualizar dados"
        });
      }
      
      // Adicionar permissões do usuário
      const permissionsData = {
        user_id: authData.user.id,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_mark_complete: true,
        can_mark_delayed: true,
        can_add_notes: true,
        can_view_reports: true,
        view_all_actions: true,
        can_edit_user: true,
        can_edit_action: true,
        can_edit_client: true,
        can_delete_client: true,
        can_edit_company: true,
        can_delete_company: true,
        view_only_assigned_actions: false
      };
      
      const { error: permissionsError } = await supabase
        .from('user_permissions')
        .insert(permissionsData);
      
      if (permissionsError) {
        console.error('Erro ao adicionar permissões:', permissionsError);
        toast.error("Aviso", {
          description: "Usuário criado, mas falha ao definir permissões"
        });
      }
      
      toast.success("Usuário Master criado", {
        description: "O usuário master foi criado com sucesso com email: fabiano@totalseguranca.net e senha: @54321"
      });
      
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input id="email" placeholder="Digite seu email" {...field} />
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
                ) : 'Criar usuário master (fabiano@totalseguranca.net)'}
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
