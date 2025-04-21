
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission } from '@/lib/types';
import { defaultMasterUser } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (cpf: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: { 
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master'; 
    companyIds: string[];
    clientIds?: string[];
    permissions?: any
  }) => Promise<boolean>;
  updateUser: (userData: { 
    id: string;
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master';
    companyIds: string[];
    clientIds?: string[];
    permissions?: any
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
  const { toast } = useToast();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) {
          console.error('Erro ao carregar perfis do Supabase:', error);
          loadFromLocalStorage();
          return;
        }

        if (profiles && profiles.length > 0) {
          console.log('Perfis carregados do Supabase:', profiles);
          
          const loadedUsers: User[] = profiles.map(profile => {
            // Ensure role is either 'user' or 'master', defaulting to 'user' if invalid
            const userRole: 'user' | 'master' = 
              profile.role === 'master' ? 'master' : 'user';
              
            return {
              id: profile.id,
              name: profile.name,
              cpf: profile.cpf || '',
              email: profile.email || `${profile.cpf}@example.com`,
              role: userRole,
              companyIds: profile.company_ids || ['1'],
              clientIds: profile.client_ids || [],
              password: undefined,
              permissions: [{
                id: "default",
                name: "Default Permissions",
                description: "Default user permissions",
                canCreate: userRole === 'master',
                canEdit: userRole === 'master',
                canDelete: userRole === 'master',
                canMarkComplete: true,
                canMarkDelayed: true,
                canAddNotes: true,
                canViewReports: userRole === 'master',
                viewAllActions: userRole === 'master',
                canEditUser: userRole === 'master',
                canEditAction: userRole === 'master',
                canEditClient: userRole === 'master',
                canDeleteClient: userRole === 'master',
                canEditCompany: userRole === 'master',
                canDeleteCompany: userRole === 'master',
                viewOnlyAssignedActions: userRole !== 'master',
              }]
            };
          });
          
          setUsers(loadedUsers);
          localStorage.setItem('users', JSON.stringify(loadedUsers));
        } else {
          console.log('Nenhum perfil encontrado no Supabase, carregando do localStorage');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Erro ao analisar usuário do localStorage:', error);
          localStorage.removeItem('user');
        }
      }

      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        try {
          const parsedUsers = JSON.parse(savedUsers);
          
          const updatedUsers = parsedUsers.map((u: User) => {
            const updatedUser = {
              ...u,
              email: u.email || `${u.cpf}@example.com`,
              companyIds: u.companyIds || ['1'],
              clientIds: u.clientIds || []
            };
            
            if (updatedUser.permissions && updatedUser.permissions.length > 0) {
              updatedUser.permissions = updatedUser.permissions.map(permission => ({
                ...permission,
                canEditCompany: 'canEditCompany' in permission ? permission.canEditCompany : (u.role === 'master'),
                canDeleteCompany: 'canDeleteCompany' in permission ? permission.canDeleteCompany : (u.role === 'master')
              }));
            }
            
            return updatedUser;
          });
          
          setUsers(updatedUsers);
          localStorage.setItem('users', JSON.stringify(updatedUsers));
        } catch (error) {
          console.error('Erro ao analisar usuários do localStorage:', error);
        }
      } else {
        setUsers([defaultMasterUser]);
        localStorage.setItem('users', JSON.stringify([defaultMasterUser]));
      }
    };

    loadUsers();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Evento de autenticação:', event, session);
        if (session) {
          fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return;
      }

      if (profile) {
        const { data: permissions, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (permissionsError && permissionsError.code !== 'PGRST116') {
          console.error('Erro ao buscar permissões do usuário:', permissionsError);
        }

        const userPermissions = permissions || {
          can_create: profile.role === 'master',
          can_edit: profile.role === 'master',
          can_delete: profile.role === 'master',
          can_mark_complete: true,
          can_mark_delayed: true,
          can_add_notes: true,
          can_view_reports: profile.role === 'master',
          view_all_actions: profile.role === 'master',
          can_edit_user: profile.role === 'master',
          can_edit_action: profile.role === 'master',
          can_edit_client: profile.role === 'master',
          can_delete_client: profile.role === 'master',
          can_edit_company: profile.role === 'master',
          can_delete_company: profile.role === 'master',
          view_only_assigned_actions: profile.role !== 'master'
        };

        // Convert profile.role to the correct type, ensuring it's either 'user' or 'master'
        const safeRole: 'user' | 'master' = profile.role === 'master' ? 'master' : 'user';

        const userObject: User = {
          id: profile.id,
          name: profile.name,
          cpf: profile.cpf || '',
          email: profile.email || '',
          role: safeRole,
          companyIds: profile.company_ids || ['1'],
          clientIds: profile.client_ids || [],
          permissions: [{
            id: "default",
            name: "Default Permissions",
            description: "Default user permissions",
            canCreate: userPermissions.can_create,
            canEdit: userPermissions.can_edit,
            canDelete: userPermissions.can_delete,
            canMarkComplete: userPermissions.can_mark_complete,
            canMarkDelayed: userPermissions.can_mark_delayed,
            canAddNotes: userPermissions.can_add_notes,
            canViewReports: userPermissions.can_view_reports,
            viewAllActions: userPermissions.view_all_actions,
            canEditUser: userPermissions.can_edit_user,
            canEditAction: userPermissions.can_edit_action,
            canEditClient: userPermissions.can_edit_client,
            canDeleteClient: userPermissions.can_delete_client,
            canEditCompany: userPermissions.can_edit_company,
            canDeleteCompany: userPermissions.can_delete_company,
            viewOnlyAssignedActions: userPermissions.view_only_assigned_actions,
          }]
        };

        setUser(userObject);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userObject));
      }
    } catch (error) {
      console.error('Erro ao processar perfil do usuário:', error);
    }
  };

  const normalizeCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
  };

  const login = async (cpf: string, password: string): Promise<boolean> => {
    try {
      const normalizedCPF = normalizeCPF(cpf);
      console.log("Tentando login com CPF normalizado:", normalizedCPF);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', normalizedCPF);
      
      if (profilesError) {
        console.error('Erro ao buscar perfil:', profilesError);
        return loginWithLocalStorage(normalizedCPF, password);
      }
      
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        
        const localProfiles = JSON.parse(localStorage.getItem('users') || '[]');
        const localProfile = localProfiles.find((p: any) => p.id === profile.id);
        
        if (password === '@54321' || (localProfile && password === localProfile.password)) {
          await fetchUserProfile(profile.id);
          
          toast({
            title: "Login realizado com sucesso",
            description: `Bem-vindo, ${profile.name}!`,
            variant: "default",
          });
          return true;
        }
      }
      
      return loginWithLocalStorage(normalizedCPF, password);
    } catch (error) {
      console.error('Erro no login:', error);
      return loginWithLocalStorage(normalizedCPF, password);
    }
  };

  const loginWithLocalStorage = (normalizedCPF: string, password: string): boolean => {
    const foundUser = users.find(u => normalizeCPF(u.cpf) === normalizedCPF);
    
    if (foundUser && (password === '@54321' || password === foundUser.password)) {
      const updatedUser = {
        ...foundUser,
        permissions: foundUser.permissions.map(permission => ({
          ...permission,
          canEditCompany: 'canEditCompany' in permission ? permission.canEditCompany : (foundUser.role === 'master'),
          canDeleteCompany: 'canDeleteCompany' in permission ? permission.canDeleteCompany : (foundUser.role === 'master')
        }))
      };
      
      setUser(updatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${updatedUser.name}!`,
        variant: "default",
      });
      return true;
    }
    
    toast({
      title: "Erro no login",
      description: "CPF ou senha incorretos",
      variant: "destructive",
    });
    return false;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout do Supabase:', error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
      variant: "default",
    });
  };

  const createPermission = (role: 'user' | 'master', customPermission?: any): Permission => {
    const defaultPermissions: Permission = {
      id: "default",
      name: "Default Permissions",
      description: "Default user permissions",
      canCreate: role === 'master',
      canEdit: role === 'master',
      canDelete: role === 'master',
      canMarkComplete: true,
      canMarkDelayed: true,
      canAddNotes: true,
      canViewReports: role === 'master',
      viewAllActions: role === 'master',
      canEditUser: role === 'master',
      canEditAction: role === 'master',
      canEditClient: role === 'master',
      canDeleteClient: role === 'master',
      canEditCompany: role === 'master',
      canDeleteCompany: role === 'master',
      viewOnlyAssignedActions: role !== 'master',
    };
    
    if (customPermission) {
      return {
        ...defaultPermissions,
        ...customPermission,
      };
    }
    
    return defaultPermissions;
  };

  const addUser = async (userData: { 
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master';
    companyIds: string[];
    clientIds?: string[];
    permissions?: any
  }): Promise<boolean> => {
    try {
      const userId = Date.now().toString();
      
      const profileData = {
        id: userId,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email || `${userData.cpf}@example.com`,
        role: userData.role,
        company_ids: userData.companyIds,
        client_ids: userData.clientIds || []
      };
      
      const { data: insertedProfile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao inserir perfil no Supabase:', error);
        return addUserToLocalStorage(userData);
      }
      
      console.log('Perfil inserido com sucesso:', insertedProfile);
      
      // Create a permission object from userData.permissions or defaults
      const defaultPermission = createPermission(userData.role, userData.permissions);
      
      const permissionsToInsert = {
        user_id: insertedProfile.id,
        can_create: defaultPermission.canCreate,
        can_edit: defaultPermission.canEdit,
        can_delete: defaultPermission.canDelete,
        can_mark_complete: defaultPermission.canMarkComplete,
        can_mark_delayed: defaultPermission.canMarkDelayed,
        can_add_notes: defaultPermission.canAddNotes,
        can_view_reports: defaultPermission.canViewReports,
        view_all_actions: defaultPermission.viewAllActions,
        can_edit_user: defaultPermission.canEditUser,
        can_edit_action: defaultPermission.canEditAction,
        can_edit_client: defaultPermission.canEditClient,
        can_delete_client: defaultPermission.canDeleteClient,
        can_edit_company: defaultPermission.canEditCompany,
        can_delete_company: defaultPermission.canDeleteCompany,
        view_only_assigned_actions: defaultPermission.viewOnlyAssignedActions
      };
      
      const { error: permissionsError } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);
        
      if (permissionsError) {
        console.error('Erro ao inserir permissões no Supabase:', permissionsError);
      }
      
      const newUser: User = {
        id: insertedProfile.id,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email || `${userData.cpf}@example.com`,
        role: userData.role,
        companyIds: userData.companyIds,
        clientIds: userData.clientIds || [],
        password: '@54321',
        permissions: [defaultPermission]
      };
      
      // Ensure all users have the correct type
      const typedUsers: User[] = [...users, newUser];
      setUsers(typedUsers);
      localStorage.setItem('users', JSON.stringify(typedUsers));
      
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso",
        variant: "default",
      });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      return addUserToLocalStorage(userData);
    }
  };

  const addUserToLocalStorage = (userData: any): boolean => {
    if (users.some(u => normalizeCPF(u.cpf) === normalizeCPF(userData.cpf))) {
      toast({
        title: "Erro",
        description: "Já existe um usuário com este CPF",
        variant: "destructive",
      });
      return false;
    }

    const permission = createPermission(userData.role, userData.permissions);

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      cpf: userData.cpf,
      email: userData.email || `${userData.cpf}@example.com`,
      role: userData.role,
      companyIds: userData.companyIds,
      clientIds: userData.clientIds || [],
      permissions: [permission]
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    toast({
      title: "Usuário criado",
      description: "O usuário foi criado com sucesso",
      variant: "default",
    });
    return true;
  };

  const updateUser = async (userData: { 
    id: string;
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master';
    companyIds: string[];
    clientIds?: string[];
    permissions?: any
  }): Promise<boolean> => {
    try {
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', userData.cpf)
        .neq('id', userData.id);
        
      if (checkError) {
        console.error('Erro ao verificar CPF existente:', checkError);
        return updateUserInLocalStorage(userData);
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        toast({
          title: "Erro",
          description: "Já existe outro usuário com este CPF",
          variant: "destructive",
        });
        return false;
      }
      
      const profileData = {
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role,
        company_ids: userData.companyIds,
        client_ids: userData.clientIds || []
      };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userData.id);
        
      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        return updateUserInLocalStorage(userData);
      }
      
      if (userData.permissions) {
        const defaultPermission = createPermission(userData.role, userData.permissions);
        
        const permissionsData = {
          user_id: userData.id,
          can_create: defaultPermission.canCreate,
          can_edit: defaultPermission.canEdit,
          can_delete: defaultPermission.canDelete,
          can_mark_complete: defaultPermission.canMarkComplete,
          can_mark_delayed: defaultPermission.canMarkDelayed,
          can_add_notes: defaultPermission.canAddNotes,
          can_view_reports: defaultPermission.canViewReports,
          view_all_actions: defaultPermission.viewAllActions,
          can_edit_user: defaultPermission.canEditUser,
          can_edit_action: defaultPermission.canEditAction,
          can_edit_client: defaultPermission.canEditClient,
          can_delete_client: defaultPermission.canDeleteClient,
          can_edit_company: defaultPermission.canEditCompany,
          can_delete_company: defaultPermission.canDeleteCompany,
          view_only_assigned_actions: defaultPermission.viewOnlyAssignedActions
        };
        
        const { error: permUpdateError } = await supabase
          .from('user_permissions')
          .update(permissionsData)
          .eq('user_id', userData.id);
          
        if (permUpdateError) {
          console.error('Erro ao atualizar permissões:', permUpdateError);
        }
      }
      
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const localUser = localUsers.find((u: any) => u.id === userData.id);
      const localPassword = localUser?.password;
      
      // Create a properly typed updates
      const updatedUsers: User[] = users.map(u => {
        if (u.id === userData.id) {
          // Create permission object properly
          const userPermission = createPermission(userData.role, userData.permissions);
          return {
            ...u,
            name: userData.name,
            cpf: userData.cpf,
            email: userData.email,
            role: userData.role,
            companyIds: userData.companyIds,
            clientIds: userData.clientIds || [],
            password: localPassword,
            permissions: [userPermission]
          };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      if (user && user.id === userData.id) {
        const updatedUserData = updatedUsers.find(u => u.id === userData.id);
        if (updatedUserData) {
          setUser(updatedUserData);
          localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
      }
      
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso",
        variant: "default",
      });
      return true;
    } catch (error) {
      console.error('Erro na atualização de usuário:', error);
      return updateUserInLocalStorage(userData);
    }
  };

  const updateUserInLocalStorage = (userData: any): boolean => {
    if (users.some(u => u.cpf === userData.cpf && u.id !== userData.id)) {
      toast({
        title: "Erro",
        description: "Já existe outro usuário com este CPF",
        variant: "destructive",
      });
      return false;
    }

    const permission = createPermission(userData.role, userData.permissions);

    const updatedUsers = users.map(user => {
      if (user.id === userData.id) {
        return {
          ...user,
          name: userData.name,
          cpf: userData.cpf,
          email: userData.email || user.email,
          role: userData.role,
          companyIds: userData.companyIds,
          clientIds: userData.clientIds || user.clientIds || [],
          permissions: [permission]
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    if (user && user.id === userData.id) {
      const updatedUser = updatedUsers.find(u => u.id === userData.id);
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
    
    toast({
      title: "Usuário atualizado",
      description: "As informações do usuário foram atualizadas com sucesso",
      variant: "default",
    });
    return true;
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    const userToUpdate = users.find(u => u.id === userId);
    
    if (!userToUpdate) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
        variant: "destructive",
      });
      return false;
    }

    if (currentPassword !== '@54321' && currentPassword !== userToUpdate.password) {
      toast({
        title: "Erro",
        description: "Senha atual incorreta",
        variant: "destructive",
      });
      return false;
    }

    try {
      // For Supabase, we'll just update the local password since there's no password column
      // We're not actually storing the password in Supabase for this application
      
      // Update only the users in local storage with proper typing
      const updatedUsers: User[] = users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            password: newPassword
          };
        }
        return u;
      });

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      if (user && user.id === userId) {
        const updatedUser = updatedUsers.find(u => u.id === userId);
        if (updatedUser) {
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso",
        variant: "default",
      });
      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar a senha",
        variant: "destructive",
      });
      return false;
    }
  };

  const resetUserPassword = async (userId: string) => {
    try {
      // For Supabase, we don't actually store passwords there for this app
      // Just update local storage
      
      // Update with proper typing
      const updatedUsers: User[] = users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            password: undefined
          };
        }
        return u;
      });

      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      toast({
        title: "Senha redefinida",
        description: "A senha foi redefinida para @54321",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao redefinir a senha",
        variant: "destructive",
      });
    }
  };

  const canUserEditResponsibles = () => {
    if (!user) return false;
    
    if (user.role === 'master') return true;
    
    return user.permissions.some(p => p.canEdit);
  };

  const canUserDeleteResponsibles = () => {
    if (!user) return false;
    
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
