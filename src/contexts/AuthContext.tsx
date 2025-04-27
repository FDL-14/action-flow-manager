import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission, Responsible } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  users: User[];
  permissions: Permission | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkPermission: (permission: keyof Permission) => boolean;
  hasPermission: (permission: keyof Permission) => boolean;
  updateUserPermissions: (userId: string, permissions: Partial<Permission>) => Promise<void>;
  createResponsibleFromUser: (userId: string, responsible: Omit<Responsible, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  addUser: (userData: Partial<User>) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  permissions: null,
  loading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  checkPermission: () => false,
  hasPermission: () => false,
  updateUserPermissions: async () => {},
  createResponsibleFromUser: async () => {},
  changePassword: async () => false,
  addUser: async () => {},
  updateUser: async () => {},
  resetUserPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [authSession, setAuthSession] = useState<AuthUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          setSessionChecked(true);
          return;
        }
        
        if (session?.user) {
          await fetchUserProfile(session.user);
          setAuthSession(session.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
        setSessionChecked(true);
      }
    };
    
    checkUserSession();
  }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setLoading(true);
        
        if (event === 'SIGNED_IN' && session) {
          await fetchUserProfile(session.user);
          setAuthSession(session.user);
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setPermissions(null);
          setAuthSession(null);
          setIsAuthenticated(false);
          
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [sessionChecked, navigate, location.pathname]);

  const fetchUserProfile = async (authUser: AuthUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (error || !data) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
        
      if (permissionsError && permissionsError.code !== 'PGRST116') {
        console.error('Error fetching user permissions:', permissionsError);
      }
      
      const userPermissions = permissionsData ? {
        id: permissionsData.id,
        name: 'Default Permissions',
        description: 'Default user permissions',
        canCreate: permissionsData.can_create || false,
        canEdit: permissionsData.can_edit || false,
        canDelete: permissionsData.can_delete || false,
        canMarkComplete: permissionsData.can_mark_complete || false,
        canMarkDelayed: permissionsData.can_mark_delayed || false,
        canAddNotes: permissionsData.can_add_notes || false,
        canViewReports: permissionsData.can_view_reports || false,
        viewAllActions: permissionsData.view_all_actions || false,
        canEditUser: permissionsData.can_edit_user || false,
        canEditAction: permissionsData.can_edit_action || false,
        canEditClient: permissionsData.can_edit_client || false,
        canDeleteClient: permissionsData.can_delete_client || false,
        canCreateClient: permissionsData.can_create_client || false,
        canEditCompany: permissionsData.can_edit_company || false,
        canDeleteCompany: permissionsData.can_delete_company || false,
        viewOnlyAssignedActions: permissionsData.view_only_assigned_actions || false,
      } : {
        id: '',
        name: 'Default Permissions',
        description: 'Default user permissions',
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canMarkComplete: false,
        canMarkDelayed: false,
        canAddNotes: false,
        canViewReports: false,
        viewAllActions: false,
        canEditUser: false,
        canEditAction: false,
        canEditClient: false,
        canDeleteClient: false,
        canCreateClient: false,
        canEditCompany: false,
        canDeleteCompany: false,
        viewOnlyAssignedActions: false,
      };
      
      const userWithPermissions: User = {
        id: data.id,
        name: data.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        cpf: data.cpf || '',
        role: data.role || 'user',
        companyIds: data.company_ids || [],
        clientIds: data.client_ids || [],
        permissions: userPermissions
      };
      
      setUser(userWithPermissions);
      setPermissions(userPermissions);

      if (userWithPermissions.role === 'master' || userPermissions.canEditUser) {
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      const userPromises = data.map(async (profile) => {
        const { data: permissionsData } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', profile.id)
          .single();
          
        const userPermissions = permissionsData ? {
          id: permissionsData.id,
          name: 'Default Permissions',
          description: 'Default user permissions',
          canCreate: permissionsData.can_create || false,
          canEdit: permissionsData.can_edit || false,
          canDelete: permissionsData.can_delete || false,
          canMarkComplete: permissionsData.can_mark_complete || false,
          canMarkDelayed: permissionsData.can_mark_delayed || false,
          canAddNotes: permissionsData.can_add_notes || false,
          canViewReports: permissionsData.can_view_reports || false,
          viewAllActions: permissionsData.view_all_actions || false,
          canEditUser: permissionsData.can_edit_user || false,
          canEditAction: permissionsData.can_edit_action || false,
          canEditClient: permissionsData.can_edit_client || false,
          canDeleteClient: permissionsData.can_delete_client || false,
          canCreateClient: permissionsData.can_create_client || false,
          canEditCompany: permissionsData.can_edit_company || false,
          canDeleteCompany: permissionsData.can_delete_company || false,
          viewOnlyAssignedActions: permissionsData.view_only_assigned_actions || false,
        } : {
          id: '',
          name: 'Default Permissions',
          description: 'Default user permissions',
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canMarkComplete: false,
          canMarkDelayed: false,
          canAddNotes: false,
          canViewReports: false,
          viewAllActions: false,
          canEditUser: false,
          canEditAction: false,
          canEditClient: false,
          canDeleteClient: false,
          canCreateClient: false,
          canEditCompany: false,
          canDeleteCompany: false,
          viewOnlyAssignedActions: false,
        };
          
        return {
          id: profile.id,
          name: profile.name || profile.email?.split('@')[0] || 'User',
          email: profile.email || '',
          cpf: profile.cpf || '',
          role: profile.role || 'user',
          companyIds: profile.company_ids || [],
          clientIds: profile.client_ids || [],
          permissions: userPermissions
        } as User;
      });
      
      const users = await Promise.all(userPromises);
      setUsers(users);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
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

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Erro ao sair', {
        description: error.message || 'Não foi possível sair corretamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Conta criada', {
        description: 'Sua conta foi criada com sucesso. Você já pode fazer login.'
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Erro ao criar conta', {
        description: error.message || 'Não foi possível criar sua conta.'
      });
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw error;
      }
      
      toast.success('Email enviado', {
        description: 'Verifique seu email para recuperar sua senha.'
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error('Erro ao recuperar senha', {
        description: error.message || 'Não foi possível enviar o email de recuperação.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Senha atualizada', {
        description: 'Sua senha foi atualizada com sucesso. Você pode fazer login agora.'
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('Erro ao resetar senha', {
        description: error.message || 'Não foi possível atualizar sua senha.'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      toast.error('Erro ao atualizar perfil', {
        description: 'Você precisa estar logado para atualizar seu perfil.'
      });
      return;
    }
    
    setLoading(true);
    try {
      if (data.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email,
        });
        
        if (authError) {
          throw authError;
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name || user.name,
          cpf: data.cpf || user.cpf,
          role: data.role || user.role,
          company_ids: data.companyIds || user.companyIds,
          client_ids: data.clientIds || user.clientIds,
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      setUser({
        ...user,
        ...data,
      });
      
      toast.success('Perfil atualizado', {
        description: 'Suas informações foram atualizadas com sucesso.'
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error('Erro ao atualizar perfil', {
        description: error.message || 'Não foi possível atualizar suas informações.'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = (permission: keyof Permission): boolean => {
    if (!user || !permissions) return false;
    
    if (user.role === 'master') return true;
    
    return Boolean(permissions[permission]);
  };

  const hasPermission = checkPermission;

  const updateUserPermissions = async (userId: string, newPermissions: Partial<Permission>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        const { error: updateError } = await supabase
          .from('user_permissions')
          .update({
            can_create: newPermissions.canCreate !== undefined ? newPermissions.canCreate : data.can_create,
            can_edit: newPermissions.canEdit !== undefined ? newPermissions.canEdit : data.can_edit,
            can_delete: newPermissions.canDelete !== undefined ? newPermissions.canDelete : data.can_delete,
            can_mark_complete: newPermissions.canMarkComplete !== undefined ? newPermissions.canMarkComplete : data.can_mark_complete,
            can_mark_delayed: newPermissions.canMarkDelayed !== undefined ? newPermissions.canMarkDelayed : data.can_mark_delayed,
            can_add_notes: newPermissions.canAddNotes !== undefined ? newPermissions.canAddNotes : data.can_add_notes,
            can_view_reports: newPermissions.canViewReports !== undefined ? newPermissions.canViewReports : data.can_view_reports,
            view_all_actions: newPermissions.viewAllActions !== undefined ? newPermissions.viewAllActions : data.view_all_actions,
            can_edit_user: newPermissions.canEditUser !== undefined ? newPermissions.canEditUser : data.can_edit_user,
            can_edit_action: newPermissions.canEditAction !== undefined ? newPermissions.canEditAction : data.can_edit_action,
            can_edit_client: newPermissions.canEditClient !== undefined ? newPermissions.canEditClient : data.can_edit_client,
            can_delete_client: newPermissions.canDeleteClient !== undefined ? newPermissions.canDeleteClient : data.can_delete_client,
            can_create_client: newPermissions.canCreateClient !== undefined ? newPermissions.canCreateClient : data.can_create_client,
            can_edit_company: newPermissions.canEditCompany !== undefined ? newPermissions.canEditCompany : data.can_edit_company,
            can_delete_company: newPermissions.canDeleteCompany !== undefined ? newPermissions.canDeleteCompany : data.can_delete_company,
            view_only_assigned_actions: newPermissions.viewOnlyAssignedActions !== undefined ? newPermissions.viewOnlyAssignedActions : data.view_only_assigned_actions,
          })
          .eq('id', data.id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert({
            user_id: userId,
            can_create: newPermissions.canCreate || false,
            can_edit: newPermissions.canEdit || false,
            can_delete: newPermissions.canDelete || false,
            can_mark_complete: newPermissions.canMarkComplete || false,
            can_mark_delayed: newPermissions.canMarkDelayed || false,
            can_add_notes: newPermissions.canAddNotes || false,
            can_view_reports: newPermissions.canViewReports || false,
            view_all_actions: newPermissions.viewAllActions || false,
            can_edit_user: newPermissions.canEditUser || false,
            can_edit_action: newPermissions.canEditAction || false,
            can_edit_client: newPermissions.canEditClient || false,
            can_delete_client: newPermissions.canDeleteClient || false,
            can_create_client: newPermissions.canCreateClient || false,
            can_edit_company: newPermissions.canEditCompany || false,
            can_delete_company: newPermissions.canDeleteCompany || false,
            view_only_assigned_actions: newPermissions.viewOnlyAssignedActions || false,
          });
          
        if (insertError) {
          throw insertError;
        }
      }
      
      if (user && userId === user.id) {
        setPermissions(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...newPermissions,
          };
        });
      }
      
      if (user && (user.role === 'master' || checkPermission('canEditUser'))) {
        fetchAllUsers();
      }
      
      toast.success('Permissões atualizadas', {
        description: 'As permissões do usuário foram atualizadas com sucesso.'
      });
    } catch (error: any) {
      console.error('Update user permissions error:', error);
      toast.error('Erro ao atualizar permissões', {
        description: error.message || 'Não foi possível atualizar as permissões do usuário.'
      });
    } finally {
      setLoading(false);
    }
  };

  const createResponsibleFromUser = async (userId: string, responsibleData: Omit<Responsible, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('responsibles')
        .insert({
          name: responsibleData.name,
          email: responsibleData.email,
          phone: responsibleData.phone || '',
          department: responsibleData.department || '',
          role: responsibleData.role || '',
          type: responsibleData.type || 'responsible',
          company_id: responsibleData.companyId,
          user_id: userId,
          is_system_user: true,
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          responsible_id: data.id,
        })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }
      
      toast.success('Responsável criado', {
        description: 'O usuário foi vinculado como responsável com sucesso.'
      });
    } catch (error: any) {
      console.error('Create responsible from user error:', error);
      toast.error('Erro ao criar responsável', {
        description: error.message || 'Não foi possível vincular o usuário como responsável.'
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Senha alterada', {
        description: 'Sua senha foi alterada com sucesso.'
      });
      
      return true;
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error('Erro ao alterar senha', {
        description: error.message || 'Não foi possível alterar sua senha.'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: Partial<User>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email || '',
        password: '123456',
        email_confirm: true
      });
      
      if (error) {
        throw error;
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          role: userData.role || 'user',
          company_ids: userData.companyIds || [],
          client_ids: userData.clientIds || [],
        });
        
      if (profileError) {
        throw profileError;
      }
      
      if (userData.permissions) {
        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .insert({
            user_id: data.user.id,
            can_create: userData.permissions.canCreate || false,
            can_edit: userData.permissions.canEdit || false,
            can_delete: userData.permissions.canDelete || false,
            can_mark_complete: userData.permissions.canMarkComplete || false,
            can_mark_delayed: userData.permissions.canMarkDelayed || false,
            can_add_notes: userData.permissions.canAddNotes || false,
            can_view_reports: userData.permissions.canViewReports || false,
            view_all_actions: userData.permissions.viewAllActions || false,
            can_edit_user: userData.permissions.canEditUser || false,
            can_edit_action: userData.permissions.canEditAction || false,
            can_edit_client: userData.permissions.canEditClient || false,
            can_delete_client: userData.permissions.canDeleteClient || false,
            can_create_client: userData.permissions.canCreateClient || false,
            can_edit_company: userData.permissions.canEditCompany || false,
            can_delete_company: userData.permissions.canDeleteCompany || false,
            view_only_assigned_actions: userData.permissions.viewOnlyAssignedActions || false,
          });
          
        if (permissionsError) {
          throw permissionsError;
        }
      }
      
      toast.success('Usuário adicionado', {
        description: 'O usuário foi adicionado com sucesso.'
      });
      
      fetchAllUsers();
    } catch (error: any) {
      console.error('Add user error:', error);
      toast.error('Erro ao adicionar usuário', {
        description: error.message || 'Não foi possível adicionar o usuário.'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          role: userData.role,
          company_ids: userData.companyIds,
          client_ids: userData.clientIds,
        })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      if (userData.permissions) {
        const { error: permissionsError } = await supabase
          .from('user_permissions')
          .update({
            can_create: userData.permissions.canCreate,
            can_edit: userData.permissions.canEdit,
            can_delete: userData.permissions.canDelete,
            can_mark_complete: userData.permissions.canMarkComplete,
            can_mark_delayed: userData.permissions.canMarkDelayed,
            can_add_notes: userData.permissions.canAddNotes,
            can_view_reports: userData.permissions.canViewReports,
            view_all_actions: userData.permissions.viewAllActions,
            can_edit_user: userData.permissions.canEditUser,
            can_edit_action: userData.permissions.canEditAction,
            can_edit_client: userData.permissions.canEditClient,
            can_delete_client: userData.permissions.canDeleteClient,
            can_create_client: userData.permissions.canCreateClient,
            can_edit_company: userData.permissions.canEditCompany,
            can_delete_company: userData.permissions.canDeleteCompany,
            view_only_assigned_actions: userData.permissions.viewOnlyAssignedActions,
          })
          .eq('user_id', userId);
          
        if (permissionsError) {
          throw permissionsError;
        }
      }
      
      toast.success('Usuário atualizado', {
        description: 'O usuário foi atualizado com sucesso.'
      });
      
      fetchAllUsers();
    } catch (error: any) {
      console.error('Update user error:', error);
      toast.error('Erro ao atualizar usuário', {
        description: error.message || 'Não foi possível atualizar o usuário.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: '@54321' }
      );
      
      if (error) {
        throw error;
      }
      
      toast.success('Senha resetada', {
        description: 'A senha do usuário foi resetada com sucesso para @54321.'
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('Erro ao resetar senha', {
        description: error.message || 'Não foi possível resetar a senha do usuário.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        permissions,
        loading,
        isAuthenticated,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        updateProfile,
        checkPermission,
        hasPermission,
        updateUserPermissions,
        createResponsibleFromUser,
        changePassword,
        addUser,
        updateUser,
        resetUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
