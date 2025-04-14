
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: { 
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master'; 
    companyIds: string[];
    clientIds?: string[];
    permissions?: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canMarkComplete: boolean;
      canMarkDelayed: boolean;
      canAddNotes: boolean;
      canViewReports: boolean;
      viewAllActions: boolean;
      canEditUser: boolean;
      canEditAction: boolean;
      canEditClient: boolean;
      canDeleteClient: boolean;
      canEditCompany: boolean;
      canDeleteCompany: boolean;
      viewOnlyAssignedActions: boolean;
    }
  }) => Promise<boolean>;
  updateUser: (userData: { 
    id: string;
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master';
    companyIds: string[];
    clientIds?: string[];
    permissions?: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canMarkComplete: boolean;
      canMarkDelayed: boolean;
      canAddNotes: boolean;
      canViewReports: boolean;
      viewAllActions: boolean;
      canEditUser: boolean;
      canEditAction: boolean;
      canEditClient: boolean;
      canDeleteClient: boolean;
      canEditCompany?: boolean;
      canDeleteCompany?: boolean;
      viewOnlyAssignedActions: boolean;
    }
  }) => Promise<boolean>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => void;
  canUserEditResponsibles: () => boolean;
  canUserDeleteResponsibles: () => boolean;
  getUserCompanyIds: () => string[];
  getUserClientIds: () => string[];
  canViewAllActions: () => boolean;
  shouldViewOnlyAssignedActions: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  addUser: async () => false,
  updateUser: async () => false,
  changePassword: async () => false,
  resetUserPassword: () => {},
  canUserEditResponsibles: () => false,
  canUserDeleteResponsibles: () => false,
  getUserCompanyIds: () => [],
  getUserClientIds: () => [],
  canViewAllActions: () => false,
  shouldViewOnlyAssignedActions: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Carregar dados da sessão ao iniciar
  useEffect(() => {
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        // Buscar perfil do usuário quando autenticado
        setTimeout(() => fetchUserProfile(session.user.id), 0);
      } else {
        setUser(null);
      }
    });

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Current session:', session);
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Carregar usuários do Supabase
  useEffect(() => {
    async function fetchUsers() {
      if (supabaseUser) {
        try {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');
          
          if (error) {
            console.error('Erro ao buscar perfis:', error);
            return;
          }
          
          if (profiles) {
            // Carregar permissões para cada usuário
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
                
                const permissionsObj = permissions || {
                  canCreate: profile.role === 'master',
                  canEdit: profile.role === 'master',
                  canDelete: profile.role === 'master',
                  canMarkComplete: true,
                  canMarkDelayed: true,
                  canAddNotes: true,
                  canViewReports: profile.role === 'master',
                  viewAllActions: profile.role === 'master',
                  canEditUser: profile.role === 'master',
                  canEditAction: profile.role === 'master',
                  canEditClient: profile.role === 'master',
                  canDeleteClient: profile.role === 'master',
                  canEditCompany: profile.role === 'master',
                  canDeleteCompany: profile.role === 'master',
                  viewOnlyAssignedActions: profile.role !== 'master',
                };
                
                return {
                  id: profile.id,
                  name: profile.name,
                  cpf: profile.cpf || '',
                  email: profile.email || '',
                  role: profile.role as 'user' | 'master',
                  companyIds: profile.company_ids || ['1'],
                  clientIds: profile.client_ids || [],
                  permissions: [{
                    id: "default",
                    name: "Default Permissions",
                    description: "Default user permissions",
                    ...permissionsObj
                  }]
                };
              })
            );
            
            setUsers(usersWithPermissions);
          }
        } catch (error) {
          console.error('Erro ao processar usuários:', error);
        }
      }
    }

    fetchUsers();
  }, [supabaseUser]);

  // Buscar perfil de usuário do Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return;
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
        
        const permissionsObj = permissions || {
          canCreate: profile.role === 'master',
          canEdit: profile.role === 'master',
          canDelete: profile.role === 'master',
          canMarkComplete: true,
          canMarkDelayed: true,
          canAddNotes: true,
          canViewReports: profile.role === 'master',
          viewAllActions: profile.role === 'master',
          canEditUser: profile.role === 'master',
          canEditAction: profile.role === 'master',
          canEditClient: profile.role === 'master',
          canDeleteClient: profile.role === 'master',
          canEditCompany: profile.role === 'master',
          canDeleteCompany: profile.role === 'master',
          viewOnlyAssignedActions: profile.role !== 'master',
        };
        
        const currentUser: User = {
          id: profile.id,
          name: profile.name,
          cpf: profile.cpf || '',
          email: profile.email || '',
          role: profile.role as 'user' | 'master',
          companyIds: profile.company_ids || ['1'],
          clientIds: profile.client_ids || [],
          permissions: [{
            id: "default",
            name: "Default Permissions",
            description: "Default user permissions",
            ...permissionsObj
          }]
        };
        
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Erro ao processar perfil de usuário:', error);
    }
  };

  // Função para normalizar CPF (remover caracteres não numéricos)
  const normalizeCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
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
      
      if (data.user) {
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error("Erro no login", {
        description: error.message
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      setIsAuthenticated(false);
      toast.success("Logout realizado", {
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout", {
        description: "Ocorreu um erro ao tentar desconectar."
      });
    }
  };

  const addUser = async (userData: { 
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master';
    companyIds: string[];
    clientIds?: string[];
    permissions?: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canMarkComplete: boolean;
      canMarkDelayed: boolean;
      canAddNotes: boolean;
      canViewReports: boolean;
      viewAllActions: boolean;
      canEditUser: boolean;
      canEditAction: boolean;
      canEditClient: boolean;
      canDeleteClient: boolean;
      canEditCompany?: boolean;
      canDeleteCompany?: boolean;
      viewOnlyAssignedActions: boolean;
    }
  }): Promise<boolean> => {
    try {
      // Verificar se já existe um usuário com este CPF
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
      
      // Criar usuário no Auth com senha padrão
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
      
      // Atualizar perfil do usuário
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
      
      // Adicionar permissões do usuário
      const defaultPermissions = {
        canCreate: userData.role === 'master',
        canEdit: userData.role === 'master',
        canDelete: userData.role === 'master',
        canMarkComplete: true,
        canMarkDelayed: true,
        canAddNotes: true,
        canViewReports: userData.role === 'master',
        viewAllActions: userData.role === 'master',
        canEditUser: userData.role === 'master',
        canEditAction: userData.role === 'master',
        canEditClient: userData.role === 'master',
        canDeleteClient: userData.role === 'master',
        canEditCompany: userData.role === 'master',
        canDeleteCompany: userData.role === 'master',
        viewOnlyAssignedActions: userData.role !== 'master' && !userData.permissions?.viewAllActions,
      };
      
      const permissionsData = {
        user_id: authData.user.id,
        ...defaultPermissions,
        ...(userData.permissions || {}),
        canEditCompany: userData.permissions?.canEditCompany !== undefined ? 
          userData.permissions.canEditCompany : defaultPermissions.canEditCompany,
        canDeleteCompany: userData.permissions?.canDeleteCompany !== undefined ? 
          userData.permissions.canDeleteCompany : defaultPermissions.canDeleteCompany,
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
      
      toast.success("Usuário criado", {
        description: "O usuário foi criado com sucesso"
      });
      
      // Atualizar lista de usuários
      const newUser: User = {
        id: authData.user.id,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role,
        companyIds: userData.companyIds,
        clientIds: userData.clientIds || [],
        permissions: [{
          id: "default",
          name: "Default Permissions",
          description: "Default user permissions",
          ...permissionsData
        }]
      };
      
      setUsers(prev => [...prev, newUser]);
      
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error("Erro", {
        description: error.message || "Erro ao adicionar usuário"
      });
      return false;
    }
  };

  const updateUser = async (userData: { 
    id: string;
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master';
    companyIds: string[];
    clientIds?: string[];
    permissions?: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canMarkComplete: boolean;
      canMarkDelayed: boolean;
      canAddNotes: boolean;
      canViewReports: boolean;
      viewAllActions: boolean;
      canEditUser: boolean;
      canEditAction: boolean;
      canEditClient: boolean;
      canDeleteClient: boolean;
      canEditCompany?: boolean;
      canDeleteCompany?: boolean;
      viewOnlyAssignedActions: boolean;
    }
  }): Promise<boolean> => {
    try {
      // Verificar se já existe outro usuário com este CPF
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
      
      // Atualizar perfil do usuário
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
      
      // Atualizar permissões do usuário
      const defaultPermissions = {
        canCreate: userData.role === 'master',
        canEdit: userData.role === 'master',
        canDelete: userData.role === 'master',
        canMarkComplete: true,
        canMarkDelayed: true,
        canAddNotes: true,
        canViewReports: userData.role === 'master',
        viewAllActions: userData.role === 'master',
        canEditUser: userData.role === 'master',
        canEditAction: userData.role === 'master',
        canEditClient: userData.role === 'master',
        canDeleteClient: userData.role === 'master',
        canEditCompany: userData.role === 'master',
        canDeleteCompany: userData.role === 'master',
        viewOnlyAssignedActions: userData.role !== 'master' && !userData.permissions?.viewAllActions,
      };
      
      const permissionsData = {
        user_id: userData.id,
        ...defaultPermissions,
        ...(userData.permissions || {}),
        canEditCompany: userData.permissions?.canEditCompany !== undefined ? 
          userData.permissions.canEditCompany : defaultPermissions.canEditCompany,
        canDeleteCompany: userData.permissions?.canDeleteCompany !== undefined ? 
          userData.permissions.canDeleteCompany : defaultPermissions.canDeleteCompany,
      };
      
      // Verificar se já existem permissões
      const { data: existingPermissions } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      let permissionsError;
      
      if (existingPermissions) {
        // Atualizar permissões existentes
        const { error } = await supabase
          .from('user_permissions')
          .update(permissionsData)
          .eq('user_id', userData.id);
        
        permissionsError = error;
      } else {
        // Inserir novas permissões
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
      
      // Atualizar lista de usuários
      const updatedUser: User = {
        id: userData.id,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role,
        companyIds: userData.companyIds,
        clientIds: userData.clientIds || [],
        permissions: [{
          id: "default",
          name: "Default Permissions",
          description: "Default user permissions",
          ...permissionsData
        }]
      };
      
      setUsers(prev => prev.map(u => u.id === userData.id ? updatedUser : u));
      
      // Se for o usuário atual, atualizar também o estado do usuário
      if (user && user.id === userData.id) {
        setUser(updatedUser);
      }
      
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error("Erro", {
        description: error.message || "Erro ao atualizar usuário"
      });
      return false;
    }
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // Usuário só pode mudar a própria senha
      if (supabaseUser && supabaseUser.id === userId) {
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
        // Administrador pode redefinir senha de qualquer usuário
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

  const resetUserPassword = async (userId: string) => {
    try {
      // Para resetar a senha, um administrador precisa gerar um link de redefinição
      // Como não temos essa funcionalidade direta no Supabase, vamos simular
      
      // Buscar email do usuário
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
      
      // Enviar email de redefinição de senha
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

  const canUserEditResponsibles = () => {
    if (!user) return false;
    
    // Admin or master can always edit
    if (user.role === 'master') return true;
    
    // Check for specific permission
    return user.permissions.some(p => p.canEdit);
  };

  const canUserDeleteResponsibles = () => {
    if (!user) return false;
    
    // Only admin/master can delete
    return user.role === 'master';
  };

  const getUserCompanyIds = () => {
    if (!user) return [];
    return user.companyIds || ['1'];
  };

  const getUserClientIds = () => {
    if (!user) return [];
    return user.clientIds || [];
  };

  const canViewAllActions = () => {
    if (!user) return false;
    if (user.role === 'master') return true;
    return user.permissions.some(p => p.viewAllActions);
  };

  const shouldViewOnlyAssignedActions = () => {
    if (!user) return false;
    if (user.role === 'master') return false;
    return user.permissions.some(p => p.viewOnlyAssignedActions);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users,
      isAuthenticated, 
      login, 
      logout,
      addUser,
      updateUser,
      changePassword,
      resetUserPassword,
      canUserEditResponsibles,
      canUserDeleteResponsibles,
      getUserCompanyIds,
      getUserClientIds,
      canViewAllActions,
      shouldViewOnlyAssignedActions
    }}>
      {children}
    </AuthContext.Provider>
  );
};
