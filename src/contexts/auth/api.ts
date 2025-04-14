
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, AddUserData, UpdateUserData } from './types';
import { 
  normalizeCPF, 
  getDefaultPermissions, 
  mapPermissionsFromDB, 
  transformPermissionsForDB,
  createUserObject,
  validateUserRole
} from './utils';

// Fetch user profile from Supabase
export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
    
    if (profile) {
      const { data: permissions, error: permError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (permError && permError.code !== 'PGRST116') {
        console.error('Erro ao buscar permissões:', permError);
      }
      
      // Define default permissions based on user role
      const role = validateUserRole(profile.role);
      const defaultPermissions = getDefaultPermissions(role);
      
      // Merge with any permissions from the database
      const permissionsObj = {
        ...defaultPermissions,
        ...(permissions || {})
      };
      
      // Map permissions to camelCase format
      const mappedPermissions = mapPermissionsFromDB(permissionsObj, defaultPermissions);
      
      return createUserObject(profile, mappedPermissions);
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao processar perfil de usuário:', error);
    return null;
  }
};

// Fetch all users from Supabase
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar perfis:', error);
      return [];
    }
    
    if (profiles) {
      // Load permissions for each user
      const usersWithPermissions = await Promise.all(
        profiles.map(async (profile) => {
          const { data: permissions, error: permError } = await supabase
            .from('user_permissions')
            .select('*')
            .eq('user_id', profile.id)
            .single();
          
          if (permError && permError.code !== 'PGRST116') {
            console.error('Erro ao buscar permissões:', permError);
          }
          
          // Define default permissions based on user role
          const role = validateUserRole(profile.role);
          const defaultPermissions = getDefaultPermissions(role);
          
          // Merge with any permissions from the database
          const permissionsObj = {
            ...defaultPermissions,
            ...(permissions || {})
          };
          
          // Map permissions to camelCase format
          const mappedPermissions = mapPermissionsFromDB(permissionsObj, defaultPermissions);
          
          return createUserObject(profile, mappedPermissions);
        })
      );
      
      return usersWithPermissions;
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao processar usuários:', error);
    return [];
  }
};

// Login with Supabase
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error("Erro no login:", error);
      toast.error("Erro no login", {
        description: error.message
      });
      return false;
    }
    
    return !!data.user;
  } catch (error: any) {
    console.error("Erro no login:", error);
    toast.error("Erro no login", {
      description: error.message
    });
    return false;
  }
};

// Logout with Supabase
export const logoutUser = async (): Promise<boolean> => {
  try {
    await supabase.auth.signOut();
    toast.success("Logout realizado", {
      description: "Você foi desconectado com sucesso."
    });
    return true;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    toast.error("Erro ao fazer logout", {
      description: "Ocorreu um erro ao tentar desconectar."
    });
    return false;
  }
};

// Add new user to Supabase
export const addUser = async (userData: AddUserData): Promise<boolean> => {
  try {
    // Check if user with same CPF already exists
    const { data: existingUser, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('cpf', normalizeCPF(userData.cpf))
      .maybeSingle();
    
    if (queryError) {
      console.error('Erro ao verificar usuário existente:', queryError);
      toast.error("Erro", {
        description: "Erro ao verificar se o usuário já existe"
      });
      return false;
    }
    
    if (existingUser) {
      toast.error("Erro", {
        description: "Já existe um usuário com este CPF"
      });
      return false;
    }
    
    // Create user in Auth with default password
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: '@54321',
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        cpf: userData.cpf
      }
    });
    
    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      toast.error("Erro", {
        description: authError.message
      });
      return false;
    }
    
    if (!authData.user) {
      toast.error("Erro", {
        description: "Falha ao criar usuário"
      });
      return false;
    }
    
    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role,
        company_ids: userData.companyIds,
        client_ids: userData.clientIds || []
      })
      .eq('id', authData.user.id);
    
    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      toast.error("Erro", {
        description: "Perfil criado, mas falha ao atualizar dados"
      });
    }
    
    // Get default permissions based on role
    const defaultPermissions = getDefaultPermissions(userData.role);
    
    // Transform permissions to database format
    const permissionsData = transformPermissionsForDB(
      authData.user.id,
      userData.permissions,
      defaultPermissions
    );
    
    // Add user permissions
    const { error: permissionsError } = await supabase
      .from('user_permissions')
      .insert(permissionsData);
    
    if (permissionsError) {
      console.error('Erro ao adicionar permissões:', permissionsError);
      toast.error("Aviso", {
        description: "Usuário criado, mas falha ao definir permissões"
      });
    }
    
    toast.success("Usuário criado", {
      description: "O usuário foi criado com sucesso"
    });
    
    return true;
  } catch (error: any) {
    console.error('Erro ao adicionar usuário:', error);
    toast.error("Erro", {
      description: error.message || "Erro ao adicionar usuário"
    });
    return false;
  }
};

// Update existing user in Supabase
export const updateUser = async (userData: UpdateUserData): Promise<boolean> => {
  try {
    // Check if another user with same CPF already exists
    const { data: existingUser, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('cpf', normalizeCPF(userData.cpf))
      .neq('id', userData.id)
      .maybeSingle();
    
    if (queryError) {
      console.error('Erro ao verificar usuário existente:', queryError);
      toast.error("Erro", {
        description: "Erro ao verificar se o usuário já existe"
      });
      return false;
    }
    
    if (existingUser) {
      toast.error("Erro", {
        description: "Já existe outro usuário com este CPF"
      });
      return false;
    }
    
    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role,
        company_ids: userData.companyIds,
        client_ids: userData.clientIds || []
      })
      .eq('id', userData.id);
    
    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      toast.error("Erro", {
        description: "Falha ao atualizar dados do usuário"
      });
      return false;
    }
    
    // Get default permissions based on role
    const defaultPermissions = getDefaultPermissions(userData.role);
    
    // Transform permissions to database format
    const permissionsData = transformPermissionsForDB(
      userData.id,
      userData.permissions,
      defaultPermissions
    );
    
    // Check if permissions already exist
    const { data: existingPermissions } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();
    
    let permissionsError;
    
    if (existingPermissions) {
      // Update existing permissions
      const { error } = await supabase
        .from('user_permissions')
        .update(permissionsData)
        .eq('user_id', userData.id);
      
      permissionsError = error;
    } else {
      // Insert new permissions
      const { error } = await supabase
        .from('user_permissions')
        .insert(permissionsData);
      
      permissionsError = error;
    }
    
    if (permissionsError) {
      console.error('Erro ao atualizar permissões:', permissionsError);
      toast.error("Aviso", {
        description: "Usuário atualizado, mas falha ao atualizar permissões"
      });
    }
    
    toast.success("Usuário atualizado", {
      description: "As informações do usuário foram atualizadas com sucesso"
    });
    
    return true;
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    toast.error("Erro", {
      description: error.message || "Erro ao atualizar usuário"
    });
    return false;
  }
};

// Change user password
export const changeUserPassword = async (
  userId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<boolean> => {
  try {
    // Check if user is changing their own password
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && user.id === userId) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Erro ao alterar senha:', error);
        toast.error("Erro", {
          description: error.message || "Erro ao alterar senha"
        });
        return false;
      }
      
      toast.success("Senha alterada", {
        description: "Sua senha foi alterada com sucesso"
      });
      
      return true;
    } else {
      toast.error("Erro", {
        description: "Você só pode alterar sua própria senha"
      });
      return false;
    }
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    toast.error("Erro", {
      description: error.message || "Erro ao alterar senha"
    });
    return false;
  }
};

// Reset user password
export const resetUserPassword = async (userId: string): Promise<void> => {
  try {
    // Get user email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('Erro ao buscar usuário:', userError);
      toast.error("Erro", {
        description: "Usuário não encontrado"
      });
      return;
    }
    
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(
      userData.email,
      { redirectTo: window.location.origin + '/redefinir-senha' }
    );
    
    if (error) {
      console.error('Erro ao enviar link de redefinição:', error);
      toast.error("Erro", {
        description: error.message || "Erro ao resetar senha"
      });
      return;
    }
    
    toast.success("Link enviado", {
      description: "Um link para redefinição de senha foi enviado para o email do usuário"
    });
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    toast.error("Erro", {
      description: error.message || "Erro ao resetar senha"
    });
  }
};
