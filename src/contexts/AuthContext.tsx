import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Permission } from '@/lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
  login: (cpf: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  addUser: (userData: Partial<User>) => Promise<boolean>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  users: [],
  login: async () => false,
  logout: async () => {},
  loading: false,
  changePassword: async () => false,
  addUser: async () => false,
  updateUser: async () => false,
  deleteUser: async () => false,
  resetUserPassword: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const useMockData = import.meta.env.DEV && !import.meta.env.VITE_USE_SUPABASE;

  useEffect(() => {
    if (useMockData) {
      console.log("Carregando usuários do mock-data");
      import('@/lib/mock-data').then(({ defaultMasterUser, additionalUsers }) => {
        const mockUsers = [defaultMasterUser, ...additionalUsers];
        setUsers(mockUsers);
        console.log("Usuários carregados do mock:", mockUsers);
      });
    }
  }, [useMockData]);

  useEffect(() => {
    const fetchSession = async () => {
      if (useMockData) return;
      
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsAuthenticated(true);
          const { data: userData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            return;
          }

          const { data: permissionsData, error: permissionsError } = await supabase
            .from('user_permissions')
            .select('*')
            .eq('user_id', data.session.user.id)
            .limit(1);

          if (permissionsError) {
            console.error('Error fetching user permissions:', permissionsError);
          }

          const permissions: Permission[] = permissionsData || [];

          setUser({
            ...userData,
            id: data.session.user.id,
            email: data.session.user.email || '',
            permissions,
          });
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };

    fetchSession();

    if (!useMockData) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setIsAuthenticated(true);
            const { data: userData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error) {
              console.error('Error fetching user data:', error);
              return;
            }

            const { data: permissionsData, error: permissionsError } = await supabase
              .from('user_permissions')
              .select('*')
              .eq('user_id', session.user.id)
              .limit(1);

            if (permissionsError) {
              console.error('Error fetching user permissions:', permissionsError);
            }

            const permissions: Permission[] = permissionsData || [];

            setUser({
              ...userData,
              id: session.user.id,
              email: session.user.email || '',
              permissions,
            });
          } else if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [useMockData]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (isAuthenticated && !useMockData) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*, user_permissions(*)');

          if (error) {
            console.error('Error fetching users:', error);
            return;
          }

          const formattedUsers: User[] = data.map((userData) => ({
            id: userData.id,
            name: userData.name,
            cpf: userData.cpf || '',
            email: userData.email || '',
            role: userData.role || 'user',
            companyIds: userData.company_ids || [],
            clientIds: userData.client_ids || [],
            department: userData.department || '',
            phone: userData.phone || '',
            permissions: userData.user_permissions || []
          }));

          setUsers(formattedUsers);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }
    };

    fetchUsers();
  }, [isAuthenticated, useMockData]);

  const login = async (cpf: string, password: string) => {
    setLoading(true);
    try {
      console.log(`Attempting login with CPF: ${cpf}, password length: ${password.length}`);
      
      const cleanedCpf = cpf.replace(/[^\d]/g, '');
      console.log(`CPF limpo para autenticação: ${cleanedCpf}`);
      
      if (useMockData) {
        const mockUser = users.find(u => u.cpf.replace(/[^\d]/g, '') === cleanedCpf);
        console.log("Usuário encontrado no mock:", mockUser);
        
        if (mockUser && password === '@54321') {
          console.log("Login bem-sucedido com mock data");
          setIsAuthenticated(true);
          setUser(mockUser);
          return true;
        } else {
          console.error("Login falhou com mock data - usuário não encontrado ou senha incorreta");
          throw new Error('CPF ou senha incorretos');
        }
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('cpf', cleanedCpf)
        .single();

      if (profileError || !profileData) {
        console.error('User lookup error:', profileError);
        throw new Error('Usuário não encontrado com este CPF');
      }
      
      console.log(`Found user with email: ${profileData.email}`);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('Login successful');
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

  const logout = async () => {
    try {
      if (!useMockData) {
        await supabase.auth.signOut();
      }
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error getting user email:', userError);
        toast.error('Erro ao obter dados do usuário');
        return false;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: currentPassword,
      });

      if (signInError) {
        console.error('Error signing in:', signInError);
        toast.error('Senha atual incorreta');
        return false;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
        toast.error('Erro ao atualizar senha');
        return false;
      }

      toast.success('Senha alterada com sucesso');
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha');
      return false;
    }
  };

  const addUser = async (userData: Partial<User>) => {
    try {
      const email = userData.email;
      const password = userData.password || '@54321';
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: email!,
        password,
        email_confirm: true,
      });

      if (error) {
        console.error('Error creating user:', error);
        toast.error('Erro ao criar usuário');
        return false;
      }

      const userId = data.user.id;
      
      const profileData = {
        id: userId,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role || 'user',
        company_ids: userData.companyIds || [],
        client_ids: userData.clientIds || [],
        department: userData.department || '',
        phone: userData.phone || '',
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        toast.error('Erro ao criar perfil do usuário');
        return false;
      }

      if (userData.permissions && userData.permissions.length > 0) {
        const permissionsData = {
          user_id: userId,
          can_create: userData.permissions[0].canCreate || false,
          can_edit: userData.permissions[0].canEdit || false,
          can_delete: userData.permissions[0].canDelete || false,
          can_mark_complete: userData.permissions[0].canMarkComplete || false,
          can_mark_delayed: userData.permissions[0].canMarkDelayed || false,
          can_add_notes: userData.permissions[0].canAddNotes || false,
          can_view_reports: userData.permissions[0].canViewReports || false,
          view_all_actions: userData.permissions[0].viewAllActions || false,
          can_edit_user: userData.permissions[0].canEditUser || false,
          can_edit_action: userData.permissions[0].canEditAction || false,
          can_edit_client: userData.permissions[0].canEditClient || false,
          can_delete_client: userData.permissions[0].canDeleteClient || false,
          can_create_client: userData.permissions[0].canCreateClient || false,
          can_edit_company: userData.permissions[0].canEditCompany || false,
          can_delete_company: userData.permissions[0].canDeleteCompany || false,
          view_only_assigned_actions: userData.permissions[0].viewOnlyAssignedActions || false,
        };

        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .insert(permissionsData);

        if (permissionsError) {
          console.error('Error setting user permissions:', permissionsError);
          toast.error('Erro ao configurar permissões do usuário');
        }
      }

      toast.success('Usuário criado com sucesso');
      
      setUsers((prevUsers) => {
        const newUser: User = {
          id: userId,
          name: userData.name || '',
          cpf: userData.cpf || '',
          email: userData.email || '',
          role: userData.role || 'user',
          companyIds: userData.companyIds || [],
          clientIds: userData.clientIds || [],
          department: userData.department || '',
          phone: userData.phone || '',
          permissions: userData.permissions || []
        };
        
        return [...prevUsers, newUser];
      });
      
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Erro ao adicionar usuário');
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      const profileData: any = {};
      
      if (userData.name) profileData.name = userData.name;
      if (userData.cpf) profileData.cpf = userData.cpf;
      if (userData.role) profileData.role = userData.role;
      if (userData.companyIds) profileData.company_ids = userData.companyIds;
      if (userData.clientIds) profileData.client_ids = userData.clientIds;
      if (userData.department) profileData.department = userData.department;
      if (userData.phone) profileData.phone = userData.phone;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast.error('Erro ao atualizar perfil do usuário');
        return false;
      }

      if (userData.permissions && userData.permissions.length > 0) {
        const permissionsData: any = {
          can_create: userData.permissions[0].canCreate,
          can_edit: userData.permissions[0].canEdit,
          can_delete: userData.permissions[0].canDelete,
          can_mark_complete: userData.permissions[0].canMarkComplete,
          can_mark_delayed: userData.permissions[0].canMarkDelayed,
          can_add_notes: userData.permissions[0].canAddNotes,
          can_view_reports: userData.permissions[0].canViewReports,
          view_all_actions: userData.permissions[0].viewAllActions,
          can_edit_user: userData.permissions[0].canEditUser,
          can_edit_action: userData.permissions[0].canEditAction,
          can_edit_client: userData.permissions[0].canEditClient,
          can_delete_client: userData.permissions[0].canDeleteClient,
          can_create_client: userData.permissions[0].canCreateClient,
          can_edit_company: userData.permissions[0].canEditCompany,
          can_delete_company: userData.permissions[0].canDeleteCompany,
          view_only_assigned_actions: userData.permissions[0].viewOnlyAssignedActions,
        };

        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .update(permissionsData)
          .eq('user_id', userId);

        if (permissionsError) {
          console.error('Error updating user permissions:', permissionsError);
          toast.error('Erro ao atualizar permissões do usuário');
        }
      }

      if (userData.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          userId,
          { email: userData.email }
        );

        if (emailError) {
          console.error('Error updating user email:', emailError);
          toast.error('Erro ao atualizar email do usuário');
        }
      }

      if (userData.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: userData.password }
        );

        if (passwordError) {
          console.error('Error updating user password:', passwordError);
          toast.error('Erro ao atualizar senha do usuário');
        }
      }

      toast.success('Usuário atualizado com sucesso');
      
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId
            ? { ...u, ...userData }
            : u
        )
      );
      
      if (user && user.id === userId) {
        setUser({ ...user, ...userData });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Erro ao excluir usuário');
        return false;
      }
      
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
      
      toast.success('Usuário excluído com sucesso');
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
      return false;
    }
  };

  const resetUserPassword = async (userId: string) => {
    try {
      if (useMockData) {
        console.log(`Simulando reset de senha para usuário ID: ${userId}`);
        toast.success('Senha resetada com sucesso para @54321');
        return true;
      }
      
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Error finding user:', userError);
        toast.error('Usuário não encontrado');
        return false;
      }

      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: '@54321' }
      );

      if (error) {
        console.error('Error resetting password:', error);
        toast.error('Erro ao resetar senha');
        return false;
      }

      toast.success('Senha resetada com sucesso para @54321');
      return true;
    } catch (error) {
      console.error('Error resetting user password:', error);
      toast.error('Erro ao resetar senha do usuário');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        users,
        login,
        logout,
        loading,
        changePassword,
        addUser,
        updateUser,
        deleteUser,
        resetUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
