
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
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
  const { toast } = useToast();

  // Carregar usuários do Supabase ou localStorage
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Primeiro tenta carregar do Supabase
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) {
          console.error('Erro ao carregar perfis do Supabase:', error);
          // Se falhar, carrega do localStorage como fallback
          loadFromLocalStorage();
          return;
        }

        if (profiles && profiles.length > 0) {
          console.log('Perfis carregados do Supabase:', profiles);
          
          // Converter perfis do Supabase para o formato de usuários da aplicação
          const loadedUsers: User[] = profiles.map(profile => {
            // Buscar permissões do usuário
            return {
              id: profile.id,
              name: profile.name,
              cpf: profile.cpf || '',
              email: profile.email || `${profile.cpf}@example.com`,
              role: profile.role as 'user' | 'master' || 'user',
              companyIds: profile.company_ids || ['1'],
              clientIds: profile.client_ids || [],
              permissions: [{
                id: "default",
                name: "Default Permissions",
                description: "Default user permissions",
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
            // Ensure users have proper email, companyIds, clientIds
            const updatedUser = {
              ...u,
              email: u.email || `${u.cpf}@example.com`,
              companyIds: u.companyIds || ['1'],
              clientIds: u.clientIds || []
            };
            
            // Ensure all users have the required permission properties
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
        // Initialize with default master user
        setUsers([defaultMasterUser]);
        localStorage.setItem('users', JSON.stringify([defaultMasterUser]));
      }
    };

    // Inicializar carregando usuários
    loadUsers();

    // Configurar listener para mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Evento de autenticação:', event, session);
        if (session) {
          // Atualizar estado de autenticação quando o usuário fizer login
          fetchUserProfile(session.user.id);
        } else {
          // Limpar estado quando o usuário fizer logout
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
      // Buscar perfil do usuário do Supabase
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
        // Buscar permissões do usuário
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

        const userObject: User = {
          id: profile.id,
          name: profile.name,
          cpf: profile.cpf || '',
          email: profile.email || '',
          role: profile.role || 'user',
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

  // Função para normalizar CPF (remover caracteres não numéricos)
  const normalizeCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
  };

  const login = async (cpf: string, password: string): Promise<boolean> => {
    try {
      // Normaliza o CPF removendo pontos, traços e espaços
      const normalizedCPF = normalizeCPF(cpf);
      console.log("Tentando login com CPF normalizado:", normalizedCPF);
      
      // Primeiro, tenta autenticar com Supabase
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', normalizedCPF);
      
      if (profilesError) {
        console.error('Erro ao buscar perfil:', profilesError);
        // Fallback para login local
        return loginWithLocalStorage(normalizedCPF, password);
      }
      
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        
        // Verifica a senha (em uma aplicação real, usaria autenticação adequada)
        if (password === '@54321' || password === profile.password) {
          await fetchUserProfile(profile.id);
          
          toast({
            title: "Login realizado com sucesso",
            description: `Bem-vindo, ${profile.name}!`,
            variant: "default",
          });
          return true;
        }
      }
      
      // Se falhou no Supabase, tenta login local
      return loginWithLocalStorage(normalizedCPF, password);
    } catch (error) {
      console.error('Erro no login:', error);
      return loginWithLocalStorage(normalizedCPF, password);
    }
  };
  
  const loginWithLocalStorage = (normalizedCPF: string, password: string): boolean => {
    // Verifica se há usuário com este CPF normalizado
    const foundUser = users.find(u => normalizeCPF(u.cpf) === normalizedCPF);
    
    if (foundUser && (password === '@54321' || password === foundUser.password)) {
      // Ensure user has all required permission properties before login
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
      // Tenta fazer logout no Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout do Supabase:', error);
    }
    
    // Limpa estado local de qualquer forma
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
      variant: "default",
    });
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
      // Primeiro tenta adicionar no Supabase
      const userId = Date.now().toString();
      
      const { data: insertedProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: userData.name,
          cpf: userData.cpf,
          email: userData.email || `${userData.cpf}@example.com`,
          role: userData.role,
          company_ids: userData.companyIds,
          client_ids: userData.clientIds || []
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao inserir perfil no Supabase:', error);
        // Fallback para salvar localmente
        return addUserToLocalStorage(userData);
      }
      
      console.log('Perfil inserido com sucesso:', insertedProfile);
      
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
      
      // Incluir permissões específicas se fornecidas
      const permissionsToInsert = {
        user_id: insertedProfile.id,
        can_create: userData.permissions?.canCreate ?? defaultPermissions.canCreate,
        can_edit: userData.permissions?.canEdit ?? defaultPermissions.canEdit,
        can_delete: userData.permissions?.canDelete ?? defaultPermissions.canDelete,
        can_mark_complete: userData.permissions?.canMarkComplete ?? defaultPermissions.canMarkComplete,
        can_mark_delayed: userData.permissions?.canMarkDelayed ?? defaultPermissions.canMarkDelayed,
        can_add_notes: userData.permissions?.canAddNotes ?? defaultPermissions.canAddNotes,
        can_view_reports: userData.permissions?.canViewReports ?? defaultPermissions.canViewReports,
        view_all_actions: userData.permissions?.viewAllActions ?? defaultPermissions.viewAllActions,
        can_edit_user: userData.permissions?.canEditUser ?? defaultPermissions.canEditUser,
        can_edit_action: userData.permissions?.canEditAction ?? defaultPermissions.canEditAction,
        can_edit_client: userData.permissions?.canEditClient ?? defaultPermissions.canEditClient,
        can_delete_client: userData.permissions?.canDeleteClient ?? defaultPermissions.canDeleteClient,
        can_edit_company: userData.permissions?.canEditCompany ?? defaultPermissions.canEditCompany,
        can_delete_company: userData.permissions?.canDeleteCompany ?? defaultPermissions.canDeleteCompany,
        view_only_assigned_actions: userData.permissions?.viewOnlyAssignedActions ?? defaultPermissions.viewOnlyAssignedActions
      };
      
      const { error: permissionsError } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);
        
      if (permissionsError) {
        console.error('Erro ao inserir permissões no Supabase:', permissionsError);
        // Continue mesmo com erro nas permissões, pois usaremos os valores padrão
      }
      
      // Atualizar state local e localStorage
      loadUserFromProfile(insertedProfile.id);
      
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso",
        variant: "default",
      });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      // Fallback para salvar localmente
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

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      cpf: userData.cpf,
      email: userData.email || `${userData.cpf}@example.com`,
      role: userData.role,
      companyIds: userData.companyIds,
      clientIds: userData.clientIds || [],
      permissions: [
        {
          id: "default",
          name: "Default Permissions",
          description: "Default user permissions",
          ...defaultPermissions,
          ...(userData.permissions || {}),
          canEditCompany: userData.permissions?.canEditCompany !== undefined ? 
            userData.permissions.canEditCompany : defaultPermissions.canEditCompany,
          canDeleteCompany: userData.permissions?.canDeleteCompany !== undefined ? 
            userData.permissions.canDeleteCompany : defaultPermissions.canDeleteCompany,
        }
      ]
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
  
  const loadUserFromProfile = async (profileId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
        
      if (error) {
        console.error('Erro ao carregar perfil atualizado:', error);
        return;
      }
      
      // Buscar permissões
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', profileId)
        .single();
        
      if (permissionsError && permissionsError.code !== 'PGRST116') {
        console.error('Erro ao buscar permissões:', permissionsError);
      }
      
      // Criar ou atualizar usuário local
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
      
      const userObject: User = {
        id: profile.id,
        name: profile.name,
        cpf: profile.cpf || '',
        email: profile.email || `${profile.cpf}@example.com`,
        role: profile.role || 'user',
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
      
      // Atualizar lista de usuários local
      setUsers(prevUsers => {
        const updatedUsers = [...prevUsers];
        const existingUserIndex = updatedUsers.findIndex(u => u.id === userObject.id);
        
        if (existingUserIndex >= 0) {
          updatedUsers[existingUserIndex] = userObject;
        } else {
          updatedUsers.push(userObject);
        }
        
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        return updatedUsers;
      });
    } catch (error) {
      console.error('Erro ao processar usuário após adição:', error);
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
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', userData.cpf)
        .neq('id', userData.id);
        
      if (checkError) {
        console.error('Erro ao verificar CPF existente:', checkError);
        // Fallback para atualização local
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
      
      // Atualizar perfil no Supabase
      const { error: updateError } = await supabase
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
        
      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        // Fallback para atualização local
        return updateUserInLocalStorage(userData);
      }
      
      // Atualizar permissões
      if (userData.permissions) {
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
        
        const updatedPermissions = {
          user_id: userData.id,
          can_create: userData.permissions.canCreate !== undefined ? 
            userData.permissions.canCreate : defaultPermissions.canCreate,
          can_edit: userData.permissions.canEdit !== undefined ? 
            userData.permissions.canEdit : defaultPermissions.canEdit,
          can_delete: userData.permissions.canDelete !== undefined ? 
            userData.permissions.canDelete : defaultPermissions.canDelete,
          can_mark_complete: userData.permissions.canMarkComplete !== undefined ? 
            userData.permissions.canMarkComplete : defaultPermissions.canMarkComplete,
          can_mark_delayed: userData.permissions.canMarkDelayed !== undefined ? 
            userData.permissions.canMarkDelayed : defaultPermissions.canMarkDelayed,
          can_add_notes: userData.permissions.canAddNotes !== undefined ? 
            userData.permissions.canAddNotes : defaultPermissions.canAddNotes,
          can_view_reports: userData.permissions.canViewReports !== undefined ? 
            userData.permissions.canViewReports : defaultPermissions.canViewReports,
          view_all_actions: userData.permissions.viewAllActions !== undefined ? 
            userData.permissions.viewAllActions : defaultPermissions.viewAllActions,
          can_edit_user: userData.permissions.canEditUser !== undefined ? 
            userData.permissions.canEditUser : defaultPermissions.canEditUser,
          can_edit_action: userData.permissions.canEditAction !== undefined ? 
            userData.permissions.canEditAction : defaultPermissions.canEditAction,
          can_edit_client: userData.permissions.canEditClient !== undefined ? 
            userData.permissions.canEditClient : defaultPermissions.canEditClient,
          can_delete_client: userData.permissions.canDeleteClient !== undefined ? 
            userData.permissions.canDeleteClient : defaultPermissions.canDeleteClient,
          can_edit_company: userData.permissions.canEditCompany !== undefined ? 
            userData.permissions.canEditCompany : defaultPermissions.canEditCompany,
          can_delete_company: userData.permissions.canDeleteCompany !== undefined ? 
            userData.permissions.canDeleteCompany : defaultPermissions.canDeleteCompany,
          view_only_assigned_actions: userData.permissions.viewOnlyAssignedActions !== undefined ? 
            userData.permissions.viewOnlyAssignedActions : defaultPermissions.viewOnlyAssignedActions,
        };
        
        // Verificar se já existem permissões para este usuário
        const { data: existingPermissions, error: permCheckError } = await supabase
          .from('user_permissions')
          .select('id')
          .eq('user_id', userData.id);
          
        if (permCheckError && permCheckError.code !== 'PGRST116') {
          console.error('Erro ao verificar permissões existentes:', permCheckError);
        }
        
        if (existingPermissions && existingPermissions.length > 0) {
          // Atualizar permissões existentes
          const { error: permUpdateError } = await supabase
            .from('user_permissions')
            .update(updatedPermissions)
            .eq('user_id', userData.id);
            
          if (permUpdateError) {
            console.error('Erro ao atualizar permissões:', permUpdateError);
          }
        } else {
          // Inserir novas permissões
          const { error: permInsertError } = await supabase
            .from('user_permissions')
            .insert(updatedPermissions);
            
          if (permInsertError) {
            console.error('Erro ao inserir permissões:', permInsertError);
          }
        }
      }
      
      // Carregar usuário atualizado
      await loadUserFromProfile(userData.id);
      
      // Atualizar usuário atual se necessário
      if (user && user.id === userData.id) {
        const updatedUserData = users.find(u => u.id === userData.id);
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
      // Fallback para atualização local
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

    const updatedUsers = users.map(user => {
      if (user.id === userData.id) {
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

        const updatedPermissions = {
          ...defaultPermissions,
          ...(userData.permissions || {}),
          canEditCompany: userData.permissions?.canEditCompany !== undefined ? 
            userData.permissions.canEditCompany : defaultPermissions.canEditCompany,
          canDeleteCompany: userData.permissions?.canDeleteCompany !== undefined ? 
            userData.permissions.canDeleteCompany : defaultPermissions.canDeleteCompany,
        };

        return {
          ...user,
          name: userData.name,
          cpf: userData.cpf,
          email: userData.email || user.email,
          role: userData.role,
          companyIds: userData.companyIds,
          clientIds: userData.clientIds || user.clientIds || [],
          permissions: [
            {
              id: "default",
              name: "Default Permissions",
              description: "Default user permissions",
              ...updatedPermissions
            }
          ]
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
      // Tenta atualizar a senha no Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ password: newPassword })
        .eq('id', userId);
        
      if (error) {
        console.error('Erro ao atualizar senha no Supabase:', error);
        // Continua com atualização local
      }
      
      // Sempre atualiza localmente
      const updatedUsers = users.map(u => {
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
      // Tenta redefinir senha no Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ password: undefined })
        .eq('id', userId);
        
      if (error) {
        console.error('Erro ao redefinir senha no Supabase:', error);
        // Continua com redefinição local
      }
      
      // Sempre atualiza localmente
      const updatedUsers = users.map(u => {
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
