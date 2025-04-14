
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
  const { isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cpf: '',
      password: '',
    },
  });

  useEffect(() => {
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
      cpfInput.focus();
    }
    
    // Auto-fill the admin credentials
    form.setValue('cpf', '80243088191');
    form.setValue('password', '@54321');
  }, [form]);

  const normalizeCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      const normalizedCPF = normalizeCPF(data.cpf);
      
      // Direct login with admin email format
      const email = `${normalizedCPF}@exemplo.com`;
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });
      
      if (error) {
        console.error('Erro no login:', error);
        toast.error("Erro no login", {
          description: "Credenciais inválidas, por favor tente novamente."
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
      toast.error("Erro no login", {
        description: error.message || "Ocorreu um erro durante o login. Por favor, tente novamente."
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
                  <Button type="button" variant="outline" className="flex-1" onClick={() => form.handleSubmit(onSubmit)()}>
                    Criar Conta
                  </Button>
                </div>
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
