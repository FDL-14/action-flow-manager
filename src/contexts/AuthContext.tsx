
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
                  can_add_notes: profile.role === 'master',
                  can_create: profile.role === 'master',
                  can_delete: profile.role === 'master',
                  can_mark_complete: true,
                  can_mark_delayed: true,
                  can_view_reports: profile.role === 'master',
                  view_all_actions: profile.role === 'master',
                  can_edit_user: profile.role === 'master',
                  can_edit_action: profile.role === 'master',
                  can_edit_client: profile.role === 'master',
                  can_delete_client: profile.role === 'master',
                  can_edit_company: profile.role === 'master',
                  can_delete_company: profile.role === 'master',
                  view_only_assigned_actions: profile.role !== 'master',
                };
                
                // Mapear as propriedades snake_case para camelCase
                const mappedPermissions = {
                  id: "default",
                  name: "Default Permissions",
                  description: "Default user permissions",
                  canCreate: permissionsObj.can_create,
                  canEdit: permissionsObj.can_edit,
                  canDelete: permissionsObj.can_delete,
                  canMarkComplete: permissionsObj.can_mark_complete,
                  canMarkDelayed: permissionsObj.can_mark_delayed,
                  canAddNotes: permissionsObj.can_add_notes,
                  canViewReports: permissionsObj.can_view_reports,
                  viewAllActions: permissionsObj.view_all_actions,
                  canEditUser: permissionsObj.can_edit_user,
                  canEditAction: permissionsObj.can_edit_action,
                  canEditClient: permissionsObj.can_edit_client,
                  canDeleteClient: permissionsObj.can_delete_client,
                  canEditCompany: permissionsObj.can_edit_company,
                  canDeleteCompany: permissionsObj.can_delete_company,
                  viewOnlyAssignedActions: permissionsObj.view_only_assigned_actions
                };
                
                return {
                  id: profile.id,
                  name: profile.name,
                  cpf: profile.cpf || '',
                  email: profile.email || '',
                  role: profile.role as 'user' | 'master',
                  companyIds: profile.company_ids || ['1'],
                  clientIds: profile.client_ids || [],
                  permissions: [mappedPermissions]
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
          view_only_assigned_actions: profile.role !== 'master',
        };
        
        // Mapear as propriedades snake_case para camelCase
        const mappedPermissions = {
          id: "default",
          name: "Default Permissions",
          description: "Default user permissions",
          canCreate: permissionsObj.can_create,
          canEdit: permissionsObj.can_edit,
          canDelete: permissionsObj.can_delete,
          canMarkComplete: permissionsObj.can_mark_complete,
          canMarkDelayed: permissionsObj.can_mark_delayed,
          canAddNotes: permissionsObj.can_add_notes,
          canViewReports: permissionsObj.can_view_reports,
          viewAllActions: permissionsObj.view_all_actions,
          canEditUser: permissionsObj.can_edit_user,
          canEditAction: permissionsObj.can_edit_action,
          canEditClient: permissionsObj.can_edit_client,
          canDeleteClient: permissionsObj.can_delete_client,
          canEditCompany: permissionsObj.can_edit_company,
          canDeleteCompany: permissionsObj.can_delete_company,
          viewOnlyAssignedActions: permissionsObj.view_only_assigned_actions
        };
        
        const currentUser: User = {
          id: profile.id,
          name: profile.name,
          cpf: profile.cpf || '',
          email: profile.email || '',
          role: profile.role as 'user' | 'master',
          companyIds: profile.company_ids || ['1'],
          clientIds: profile.client_ids || [],
          permissions: [mappedPermissions]
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
        can_create: userData.role === 'master',
        can_edit: userData.role === 'master',
        can_delete: userData.role === 'master',
        can_mark_complete: true,
        can_mark_delayed: true,
        can_add_notes: true,
        can_view_reports: userData.role === 'master',
        view_all_actions: userData.role === 'master',
        can_edit_user: userData.role === 'master',
        can_edit_action: userData.role === 'master',
        can_edit_client: userData.role === 'master',
        can_delete_client: userData.role === 'master',
        can_edit_company: userData.permissions?.canEditCompany !== undefined ? 
          userData.permissions.canEditCompany : userData.role === 'master',
        can_delete_company: userData.permissions?.canDeleteCompany !== undefined ? 
          userData.permissions.canDeleteCompany : userData.role === 'master',
        view_only_assigned_actions: userData.role !== 'master' && !userData.permissions?.viewAllActions,
      };
      
      // Transformar de camelCase para snake_case para o banco
      const permissionsData = {
        user_id: authData.user.id,
        can_create: userData.permissions?.canCreate !== undefined ? 
          userData.permissions.canCreate : defaultPermissions.can_create,
        can_edit: userData.permissions?.canEdit !== undefined ? 
          userData.permissions.canEdit : defaultPermissions.can_edit,
        can_delete: userData.permissions?.canDelete !== undefined ? 
          userData.permissions.canDelete : defaultPermissions.can_delete,
        can_mark_complete: userData.permissions?.canMarkComplete !== undefined ? 
          userData.permissions.canMarkComplete : defaultPermissions.can_mark_complete,
        can_mark_delayed: userData.permissions?.canMarkDelayed !== undefined ? 
          userData.permissions.canMarkDelayed : defaultPermissions.can_mark_delayed,
        can_add_notes: userData.permissions?.canAddNotes !== undefined ? 
          userData.permissions.canAddNotes : defaultPermissions.can_add_notes,
        can_view_reports: userData.permissions?.canViewReports !== undefined ? 
          userData.permissions.canViewReports : defaultPermissions.can_view_reports,
        view_all_actions: userData.permissions?.viewAllActions !== undefined ? 
          userData.permissions.viewAllActions : defaultPermissions.view_all_actions,
        can_edit_user: userData.permissions?.canEditUser !== undefined ? 
          userData.permissions.canEditUser : defaultPermissions.can_edit_user,
        can_edit_action: userData.permissions?.canEditAction !== undefined ? 
          userData.permissions.canEditAction : defaultPermissions.can_edit_action,
        can_edit_client: userData.permissions?.canEditClient !== undefined ? 
          userData.permissions.canEditClient : defaultPermissions.can_edit_client,
        can_delete_client: userData.permissions?.canDeleteClient !== undefined ? 
          userData.permissions.canDeleteClient : defaultPermissions.can_delete_client,
        can_edit_company: userData.permissions?.canEditCompany !== undefined ? 
          userData.permissions.canEditCompany : defaultPermissions.can_edit_company,
        can_delete_company: userData.permissions?.canDeleteCompany !== undefined ? 
          userData.permissions.canDeleteCompany : defaultPermissions.can_delete_company,
        view_only_assigned_actions: userData.permissions?.viewOnlyAssignedActions !== undefined ? 
          userData.permissions.viewOnlyAssignedActions : defaultPermissions.view_only_assigned_actions
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
      // Mapear as propriedades snake_case para camelCase
      const mappedPermissions = {
        id: "default",
        name: "Default Permissions",
        description: "Default user permissions",
        canCreate: permissionsData.can_create,
        canEdit: permissionsData.can_edit,
        canDelete: permissionsData.can_delete,
        canMarkComplete: permissionsData.can_mark_complete,
        canMarkDelayed: permissionsData.can_mark_delayed,
        canAddNotes: permissionsData.can_add_notes,
        canViewReports: permissionsData.can_view_reports,
        viewAllActions: permissionsData.view_all_actions,
        canEditUser: permissionsData.can_edit_user,
        canEditAction: permissionsData.can_edit_action,
        canEditClient: permissionsData.can_edit_client,
        canDeleteClient: permissionsData.can_delete_client,
        canEditCompany: permissionsData.can_edit_company,
        canDeleteCompany: permissionsData.can_delete_company,
        viewOnlyAssignedActions: permissionsData.view_only_assigned_actions
      };
      
      const newUser: User = {
        id: authData.user.id,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role,
        companyIds: userData.companyIds,
        clientIds: userData.clientIds || [],
        permissions: [mappedPermissions]
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
        can_create: userData.role === 'master',
        can_edit: userData.role === 'master',
        can_delete: userData.role === 'master',
        can_mark_complete: true,
        can_mark_delayed: true,
        can_add_notes: true,
        can_view_reports: userData.role === 'master',
        view_all_actions: userData.role === 'master',
        can_edit_user: userData.role === 'master',
        can_edit_action: userData.role === 'master',
        can_edit_client: userData.role === 'master',
        can_delete_client: userData.role === 'master',
        can_edit_company: userData.permissions?.canEditCompany !== undefined ? 
          userData.permissions.canEditCompany : userData.role === 'master',
        can_delete_company: userData.permissions?.canDeleteCompany !== undefined ? 
          userData.permissions.canDeleteCompany : userData.role === 'master',
        view_only_assigned_actions: userData.role !== 'master' && !userData.permissions?.viewAllActions,
      };
      
      // Transformar de camelCase para snake_case para o banco
      const permissionsData = {
        user_id: userData.id,
        can_create: userData.permissions?.canCreate !== undefined ? 
          userData.permissions.canCreate : defaultPermissions.can_create,
        can_edit: userData.permissions?.canEdit !== undefined ? 
          userData.permissions.canEdit : defaultPermissions.can_edit,
        can_delete: userData.permissions?.canDelete !== undefined ? 
          userData.permissions.canDelete : defaultPermissions.can_delete,
        can_mark_complete: userData.permissions?.canMarkComplete !== undefined ? 
          userData.permissions.canMarkComplete : defaultPermissions.can_mark_complete,
        can_mark_delayed: userData.permissions?.canMarkDelayed !== undefined ? 
          userData.permissions.canMarkDelayed : defaultPermissions.can_mark_delayed,
        can_add_notes: userData.permissions?.canAddNotes !== undefined ? 
          userData.permissions.canAddNotes : defaultPermissions.can_add_notes,
        can_view_reports: userData.permissions?.canViewReports !== undefined ? 
          userData.permissions.canViewReports : defaultPermissions.can_view_reports,
        view_all_actions: userData.permissions?.viewAllActions !== undefined ? 
          userData.permissions.viewAllActions : defaultPermissions.view_all_actions,
        can_edit_user: userData.permissions?.canEditUser !== undefined ? 
          userData.permissions.canEditUser : defaultPermissions.can_edit_user,
        can_edit_action: userData.permissions?.canEditAction !== undefined ? 
          userData.permissions.canEditAction : defaultPermissions.can_edit_action,
        can_edit_client: userData.permissions?.canEditClient !== undefined ? 
          userData.permissions.canEditClient : defaultPermissions.can_edit_client,
        can_delete_client: userData.permissions?.canDeleteClient !== undefined ? 
          userData.permissions.canDeleteClient : defaultPermissions.can_delete_client,
        can_edit_company: userData.permissions?.canEditCompany !== undefined ? 
          userData.permissions.canEditCompany : defaultPermissions.can_edit_company,
        can_delete_company: userData.permissions?.canDeleteCompany !== undefined ? 
          userData.permissions.canDeleteCompany : defaultPermissions.can_delete_company,
        view_only_assigned_actions: userData.permissions?.viewOnlyAssignedActions !== undefined ? 
          userData.permissions.viewOnlyAssignedActions : defaultPermissions.view_only_assigned_actions
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
      // Mapear as propriedades snake_case para camelCase
      const mappedPermissions = {
        id: "default",
        name: "Default Permissions",
        description: "Default user permissions",
        canCreate: permissionsData.can_create,
        canEdit: permissionsData.can_edit,
        canDelete: permissionsData.can_delete,
        canMarkComplete: permissionsData.can_mark_complete,
        canMarkDelayed: permissionsData.can_mark_delayed,
        canAddNotes: permissionsData.can_add_notes,
        canViewReports: permissionsData.can_view_reports,
        viewAllActions: permissionsData.view_all_actions,
        canEditUser: permissionsData.can_edit_user,
        canEditAction: permissionsData.can_edit_action,
        canEditClient: permissionsData.can_edit_client,
        canDeleteClient: permissionsData.can_delete_client,
        canEditCompany: permissionsData.can_edit_company,
        canDeleteCompany: permissionsData.can_delete_company,
        viewOnlyAssignedActions: permissionsData.view_only_assigned_actions
      };
      
      const updatedUser: User = {
        id: userData.id,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role,
        companyIds: userData.companyIds,
        clientIds: userData.clientIds || [],
        permissions: [mappedPermissions]
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

  // Adicionando as funções ausentes
  const canUserEditResponsibles = () => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    return user.role === 'master' || user.permissions[0].canEdit;
  };

  const canUserDeleteResponsibles = () => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    return user.role === 'master' || user.permissions[0].canDelete;
  };

  const getUserCompanyIds = () => {
    if (!user) return [];
    return user.companyIds || [];
  };

  const getUserClientIds = () => {
    if (!user) return [];
    return user.clientIds || [];
  };

  const canViewAllActions = () => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }
    return user.role === 'master' || user.permissions[0].viewAllActions;
  };

  const shouldViewOnlyAssignedActions = () => {
    if (!user || !user.permissions || user.permissions.length === 0) {
      return true; // Default to restricted view
    }
    return user.permissions[0].viewOnlyAssignedActions;
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
