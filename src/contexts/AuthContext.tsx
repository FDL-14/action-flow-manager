
import { supabase } from '@/integrations/supabase/client';

const login = async (email: string, password: string) => {
  setLoading(true);
  try {
    // First, find the user by CPF in the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('cpf', email)
      .single();

    if (profileError || !profileData) {
      throw new Error('Usuário não encontrado');
    }

    // Then use the email from the profile to login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: profileData.email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error('Login error:', error);
    toast.error('Erro ao fazer login', {
      description: error.message || 'Verifique suas credenciais e tente novamente.'
    });
    return false;
  } finally {
    setLoading(false);
  }
};
