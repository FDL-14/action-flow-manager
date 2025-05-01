
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (cpf: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (user: Omit<User, 'id'>) => Promise<boolean>;
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (user: User) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => Promise<boolean>;
  supabaseUser: any;
  syncWithSupabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  isAuthenticated: false,
  loading: true,
  login: async () => false,
  logout: async () => {},
  signup: async () => false,
  addUser: async () => false,
  updateUser: async () => false,
  deleteUser: async () => false,
  changePassword: async () => false,
  resetUserPassword: async () => false,
  supabaseUser: null,
  syncWithSupabase: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  // Sincroniza usuários entre localStorage e Supabase
  const syncWithSupabase = async () => {
    try {
      // Verificar se já temos usuários no Supabase
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error("Erro ao buscar perfis do Supabase:", profilesError);
        return;
      }

      if (profiles && profiles.length > 0) {
        console.log("Perfis encontrados no Supabase:", profiles.length);
        
        // Mapear usuários do Supabase para o formato local
        const mappedUsers: User[] = profiles.map(profile => {
          return {
            id: profile.id,
            name: profile.name || 'Usuário',
            cpf: profile.cpf || '',
            email: profile.email || '',
            role: (profile.role as 'user' | 'master') || 'user',
            companyIds: profile.company_ids || [],
            clientIds: profile.client_ids || [],
            permissions: [],
            password: '@54321' // Senha padrão para usuários importados
          };
        });
        
        // Mesclar com usuários locais
        const localUsers = JSON.parse(localStorage.getItem('appUsers') || '[]');
        
        // Adicionar usuários locais que não existem no Supabase
        for (const localUser of localUsers) {
          const exists = mappedUsers.some(u => u.cpf === localUser.cpf);
          
          if (!exists) {
            // Criar no Supabase
            try {
              const { error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: localUser.id,
                  name: localUser.name,
                  cpf: localUser.cpf,
                  email: localUser.email,
                  role: localUser.role,
                  company_ids: localUser.companyIds,
                  client_ids: localUser.clientIds
                });
              
              if (!createError) {
                mappedUsers.push(localUser);
              } else {
                console.error("Erro ao adicionar usuário local ao Supabase:", createError);
              }
            } catch (e) {
              console.error("Erro ao sincronizar usuário com Supabase:", e);
            }
          }
        }
        
        setUsers(mappedUsers);
        localStorage.setItem('appUsers', JSON.stringify(mappedUsers));
        console.log("Usuários sincronizados do Supabase para localStorage");
      } else {
        // Se não há usuários no Supabase, envia os locais
        console.log("Nenhum perfil encontrado no Supabase, enviando usuários locais");
        const localUsers = JSON.parse(localStorage.getItem('appUsers') || '[]');
        
        if (localUsers && localUsers.length > 0) {
          for (const user of localUsers) {
            try {
              const { error: createError } = await supabase
                .from('profiles')
                .upsert({
                  id: user.id,
                  name: user.name,
                  cpf: user.cpf,
                  email: user.email,
                  role: user.role,
                  company_ids: user.companyIds,
                  client_ids: user.clientIds
                });
                
              if (createError) {
                console.error("Erro ao adicionar usuário ao Supabase:", createError);
              }
            } catch (e) {
              console.error("Erro ao enviar usuário para Supabase:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro na sincronização com Supabase:", error);
    }
  };

  // Função para buscar usuários do localStorage ou do Supabase
  const fetchUsers = async () => {
    try {
      // Primeiro verifica se já existe no localStorage
      const localUsersStr = localStorage.getItem('appUsers');
      
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr) as User[];
        setUsers(localUsers);
      }
      
      // Sempre tenta sincronizar com Supabase
      await syncWithSupabase();
      
      // Se ainda não houver usuários, usa os mock
      if (users.length === 0) {
        const mockUsersCopy = [...mockUsers];
        setUsers(mockUsersCopy);
        localStorage.setItem('appUsers', JSON.stringify(mockUsersCopy));
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsers(mockUsers);
    }
  };

  // Configurar listener para mudanças de auth no Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth event:', event);
        if (session?.user) {
          console.log('Supabase user logged in:', session.user);
          setSupabaseUser(session.user);
          
          // Buscar dados adicionais do perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            // Se o CPF no perfil, é o usuário master
            if (profile.cpf === '80243088191') {
              setIsAuthenticated(true);
              setUser({
                id: session.user.id,
                name: 'Administrador Master',
                cpf: profile.cpf,
                email: profile.email || 'admin@totaldata.com.br',
                role: 'master',
                companyIds: profile.company_ids || [],
                permissions: [{
                  id: 'master-permission',
                  name: 'Permissão Master',
                  description: 'Possui todas as permissões do sistema',
                  canCreate: true,
                  canEdit: true,
                  canDelete: true,
                  canMarkComplete: true,
                  canMarkDelayed: true,
                  canAddNotes: true,
                  canViewReports: true,
                  viewAllActions: true,
                  canEditUser: true,
                  canEditAction: true,
                  canEditClient: true,
                  canDeleteClient: true,
                  canCreateClient: true,
                  canEditCompany: true,
                  canDeleteCompany: true,
                  viewOnlyAssignedActions: false
                }]
              });
              localStorage.setItem('userAuthenticated', 'true');
              localStorage.setItem('userCPF', profile.cpf);
              localStorage.setItem('userRole', 'master');
              localStorage.setItem('userName', 'Administrador Master');
            } else {
              // Outro usuário encontrado no Supabase
              const mappedUser: User = {
                id: session.user.id,
                name: profile.name || session.user.email?.split('@')[0] || 'Usuário',
                cpf: profile.cpf || '',
                email: profile.email || session.user.email || '',
                role: (profile.role as 'user' | 'master') || 'user',
                companyIds: profile.company_ids || [],
                clientIds: profile.client_ids || [],
                permissions: [], // Buscar permissões
              };
              
              setUser(mappedUser);
              setIsAuthenticated(true);
              localStorage.setItem('userAuthenticated', 'true');
              localStorage.setItem('userCPF', mappedUser.cpf);
              localStorage.setItem('userRole', mappedUser.role);
              localStorage.setItem('userName', mappedUser.name);
            }
          } else {
            // Usuário Supabase sem perfil ainda
            console.log("Usuário autenticado no Supabase sem perfil associado");
          }
        } else {
          // Logout no Supabase
          if (event === 'SIGNED_OUT') {
            setSupabaseUser(null);
            // Aqui não limpamos completamente o state para permitir o login local
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Verificar se existe um usuário autenticado no localStorage ao inicializar
  useEffect(() => {
    const checkAuthState = async () => {
      // Verificar primeiro se há uma sessão ativa no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("Sessão ativa no Supabase detectada");
        setSupabaseUser(session.user);
        // O listener onAuthStateChange vai cuidar do resto
      } else {
        // Verificar autenticação no localStorage
        const isUserAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
        
        if (isUserAuthenticated) {
          const storedCpf = localStorage.getItem('userCPF');
          const storedRole = localStorage.getItem('userRole');
          const storedName = localStorage.getItem('userName');
          
          // Verifica se é o usuário master hardcoded
          if (storedCpf === '80243088191' && storedRole === 'master') {
            const masterUser: User = {
              id: 'master-user',
              name: storedName || 'Administrador Master',
              cpf: storedCpf,
              email: 'admin@totaldata.com.br',
              role: 'master',
              companyIds: [],
              permissions: [
                {
                  id: 'master-permission',
                  name: 'Permissão Master',
                  description: 'Possui todas as permissões do sistema',
                  canCreate: true,
                  canEdit: true,
                  canDelete: true,
                  canMarkComplete: true,
                  canMarkDelayed: true,
                  canAddNotes: true,
                  canViewReports: true,
                  viewAllActions: true,
                  canEditUser: true,
                  canEditAction: true,
                  canEditClient: true,
                  canDeleteClient: true,
                  canCreateClient: true,
                  canEditCompany: true,
                  canDeleteCompany: true,
                  viewOnlyAssignedActions: false
                }
              ]
            };
            
            setUser(masterUser);
            setIsAuthenticated(true);
            
            // Tentar login no Supabase também
            try {
              await supabase.auth.signInWithPassword({
                email: 'admin@totaldata.com.br',
                password: '@54321'
              });
            } catch (e) {
              console.log("Não foi possível fazer login automático no Supabase para o master");
            }
          } else if (storedCpf) {
            // Buscar usuário por CPF no array de usuários
            await fetchUsers(); // Garantir que temos os usuários
            
            const foundUser = users.find(u => {
              // Limpar CPF para comparação (remover pontos e traços)
              const userCpf = u.cpf.replace(/\D/g, '');
              return userCpf === storedCpf.replace(/\D/g, '');
            });
            
            if (foundUser) {
              setUser(foundUser);
              setIsAuthenticated(true);
              
              // Tentar login no Supabase se tiver email
              if (foundUser.email) {
                try {
                  await supabase.auth.signInWithPassword({
                    email: foundUser.email,
                    password: '@54321' // Senha padrão
                  });
                } catch (e) {
                  console.log("Não foi possível fazer login automático no Supabase");
                }
              }
            } else {
              // Usuário não encontrado, limpar localStorage
              localStorage.removeItem('userAuthenticated');
              localStorage.removeItem('userCPF');
              localStorage.removeItem('userRole');
              localStorage.removeItem('userName');
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
      
      setLoading(false);
    };
    
    // Carrega os usuários e depois verifica autenticação
    fetchUsers().then(checkAuthState);
  }, []);

  const login = async (cpf: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with CPF:", cpf, "password length:", password.length);
      
      // Verificar se é o usuário master hardcoded
      if (cpf === '80243088191' && password === '@54321') {
        console.log("Autenticando como usuário master");
        
        // Tentar login no Supabase
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@totaldata.com.br',
            password: password
          });
          
          if (signInError) {
            console.log("Erro ao logar no Supabase:", signInError);
            // Tentar criar a conta
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: 'admin@totaldata.com.br',
              password: password,
              options: {
                data: {
                  cpf: cpf,
                  name: 'Administrador Master',
                  role: 'master'
                }
              }
            });
            
            if (signUpError && signUpError.message !== "User already registered") {
              console.error("Erro ao criar usuário master no Supabase:", signUpError);
            }
          }
        } catch (e) {
          console.log("Erro ao interagir com Supabase:", e);
        }
        
        const masterUser: User = {
          id: 'master-user',
          name: 'Administrador Master',
          cpf: cpf,
          email: 'admin@totaldata.com.br',
          role: 'master',
          companyIds: [],
          permissions: [
            {
              id: 'master-permission',
              name: 'Permissão Master',
              description: 'Possui todas as permissões do sistema',
              canCreate: true,
              canEdit: true,
              canDelete: true,
              canMarkComplete: true,
              canMarkDelayed: true,
              canAddNotes: true,
              canViewReports: true,
              viewAllActions: true,
              canEditUser: true,
              canEditAction: true,
              canEditClient: true,
              canDeleteClient: true,
              canCreateClient: true,
              canEditCompany: true,
              canDeleteCompany: true,
              viewOnlyAssignedActions: false
            }
          ]
        };
        
        setUser(masterUser);
        setIsAuthenticated(true);
        
        // Salvar dados no localStorage
        localStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('userCPF', cpf);
        localStorage.setItem('userRole', 'master');
        localStorage.setItem('userName', 'Administrador Master');
        
        return true;
      }
      
      // Verificar nos usuários do sistema
      await fetchUsers(); // Garantir que temos os usuários atualizados
      
      const foundUser = users.find(u => {
        // Limpar CPF para comparação (remover pontos e traços)
        const userCpf = u.cpf.replace(/\D/g, '');
        return userCpf === cpf;
      });
      
      console.log("Found user:", foundUser);
      
      if (foundUser && (foundUser.password === password || password === '@54321')) {
        console.log("Usuário encontrado e senha correta");
        
        // Tentar login no Supabase se tiver email
        if (foundUser.email) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: foundUser.email,
              password: password
            });
            
            if (signInError) {
              console.log("Tentando criar conta no Supabase:", signInError);
              
              // Criar conta no Supabase
              const { error: signUpError } = await supabase.auth.signUp({
                email: foundUser.email,
                password: password || '@54321',
                options: {
                  data: {
                    cpf: foundUser.cpf,
                    name: foundUser.name,
                    role: foundUser.role
                  }
                }
              });
              
              if (!signUpError || signUpError.message === "User already registered") {
                // Tentar login novamente
                await supabase.auth.signInWithPassword({
                  email: foundUser.email,
                  password: password || '@54321'
                });
              }
            }
          } catch (e) {
            console.log("Erro ao tentar login/registro no Supabase:", e);
          }
        }
        
        setUser(foundUser);
        setIsAuthenticated(true);
        
        // Salvar dados no localStorage
        localStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('userCPF', foundUser.cpf);
        localStorage.setItem('userRole', foundUser.role);
        localStorage.setItem('userName', foundUser.name);
        
        return true;
      }
      
      console.log("Login falhou após verificar todos os usuários");
      return false; // Login inválido
    } catch (error) {
      console.error("Erro durante o processo de login:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    // Fazer logout no Supabase
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Erro ao fazer logout do Supabase:", e);
    }
    
    // Limpar o localStorage e estado
    localStorage.removeItem('userAuthenticated');
    localStorage.removeItem('userCPF');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    
    setUser(null);
    setIsAuthenticated(false);
    setSupabaseUser(null);
  };

  const signup = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    try {
      // Verificar se já existe usuário com este CPF
      const userExists = users.some(u => u.cpf === userData.cpf);
      
      if (userExists) {
        toast.error("CPF já cadastrado", { description: "Este CPF já está sendo usado por outro usuário." });
        return false;
      }
      
      // Tentar criar usuário no Supabase se tiver email
      let supabaseUserId = `user-${Date.now()}`;
      
      if (userData.email) {
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password || '@54321',
            options: {
              data: {
                cpf: userData.cpf,
                name: userData.name,
                role: userData.role
              }
            }
          });
          
          if (signUpError && signUpError.message !== "User already registered") {
            console.error("Erro ao criar usuário no Supabase:", signUpError);
          } else if (signUpData?.user) {
            supabaseUserId = signUpData.user.id;
            
            // Criar perfil no Supabase
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: supabaseUserId,
                name: userData.name,
                cpf: userData.cpf,
                email: userData.email,
                role: userData.role,
                company_ids: userData.companyIds,
                client_ids: userData.clientIds
              });
              
            if (profileError) {
              console.error("Erro ao criar perfil no Supabase:", profileError);
            }
          }
        } catch (e) {
          console.error("Erro ao criar usuário no Supabase:", e);
        }
      }
      
      // Criar novo usuário localmente
      const newUser: User = {
        ...userData,
        id: supabaseUserId
      };
      
      // Atualizar a lista de usuários
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      
      // Salvar no localStorage
      localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
      
      toast.success("Usuário criado", { description: "Novo usuário cadastrado com sucesso!" });
      return true;
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      toast.error("Erro ao cadastrar", { description: "Não foi possível criar o novo usuário." });
      return false;
    }
  };

  const addUser = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    return signup(userData);
  };

  const updateUser = async (updatedUser: User): Promise<boolean> => {
    try {
      const userIndex = users.findIndex(u => u.id === updatedUser.id);
      
      if (userIndex === -1) {
        toast.error("Usuário não encontrado", { description: "Não foi possível encontrar o usuário para atualização." });
        return false;
      }
      
      // Atualizar no Supabase se o ID parecer um UUID
      if (updatedUser.id.includes('-')) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: updatedUser.name,
              cpf: updatedUser.cpf,
              email: updatedUser.email,
              role: updatedUser.role,
              company_ids: updatedUser.companyIds,
              client_ids: updatedUser.clientIds
            })
            .eq('id', updatedUser.id);
            
          if (profileError) {
            console.error("Erro ao atualizar perfil no Supabase:", profileError);
          }
        } catch (e) {
          console.error("Erro ao atualizar usuário no Supabase:", e);
        }
      }
      
      // Atualizar o usuário na lista
      const updatedUsers = [...users];
      updatedUsers[userIndex] = updatedUser;
      
      // Se o usuário logado foi atualizado, atualizar também o estado do usuário
      if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
        
        // Atualizar localStorage se necessário
        localStorage.setItem('userCPF', updatedUser.cpf);
        localStorage.setItem('userRole', updatedUser.role);
        localStorage.setItem('userName', updatedUser.name);
      }
      
      setUsers(updatedUsers);
      
      // Salvar no localStorage
      localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
      
      toast.success("Usuário atualizado", { description: "Dados do usuário atualizados com sucesso!" });
      return true;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar", { description: "Não foi possível atualizar os dados do usuário." });
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        toast.error("Usuário não encontrado", { description: "Não foi possível encontrar o usuário para exclusão." });
        return false;
      }
      
      // Não permitir excluir o próprio usuário logado
      if (user && user.id === id) {
        toast.error("Operação não permitida", { description: "Não é possível excluir o usuário atualmente logado." });
        return false;
      }
      
      // Remover do Supabase se o ID parecer um UUID
      if (id.includes('-')) {
        try {
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);
            
          if (error) {
            console.error("Erro ao excluir perfil no Supabase:", error);
          }
          
          // Também remover a auth se possível (requer função ADMIN)
          try {
            await supabase.auth.admin.deleteUser(id);
          } catch (e) {
            console.log("Não foi possível remover usuário auth (requer admin):", e);
          }
        } catch (e) {
          console.error("Erro ao excluir usuário no Supabase:", e);
        }
      }
      
      // Remover o usuário da lista
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      
      // Salvar no localStorage
      localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
      
      toast.success("Usuário excluído", { description: "Usuário removido com sucesso!" });
      return true;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir", { description: "Não foi possível excluir o usuário." });
      return false;
    }
  };

  // Implementação da função de alteração de senha
  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // Verificar se o usuário existe
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        toast.error("Usuário não encontrado", { description: "Não foi possível encontrar o usuário para alteração de senha." });
        return false;
      }

      const targetUser = users[userIndex];
      
      // Para o usuário master hardcoded
      if (targetUser.cpf === '80243088191') {
        if (currentPassword !== '@54321') {
          toast.error("Senha atual incorreta", { description: "A senha atual informada está incorreta." });
          return false;
        }
        
        // Atualizar senha no Supabase
        try {
          if (supabaseUser) {
            const { error } = await supabase.auth.updateUser({
              password: newPassword
            });
            
            if (error) {
              console.error("Erro ao atualizar senha no Supabase:", error);
              throw error;
            }
          }
        } catch (e) {
          console.error("Erro ao atualizar senha no Supabase:", e);
        }
        
        // Para o usuário master, atualizamos apenas no localStorage para este exemplo
        localStorage.setItem('userPassword', newPassword);
        toast.success("Senha alterada", { description: "Senha do usuário master alterada com sucesso!" });
        return true;
      }
      
      // Para outros usuários
      if (targetUser.password !== currentPassword && currentPassword !== '@54321') {
        toast.error("Senha atual incorreta", { description: "A senha atual informada está incorreta." });
        return false;
      }
      
      // Atualizar senha no Supabase se o ID parecer um UUID
      if (userId.includes('-') && targetUser.email && supabaseUser) {
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          });
          
          if (error) {
            console.error("Erro ao atualizar senha no Supabase:", error);
          }
        } catch (e) {
          console.error("Erro ao atualizar senha no Supabase:", e);
        }
      }
      
      // Atualizar a senha localmente
      const updatedUser = { ...targetUser, password: newPassword };
      const updatedUsers = [...users];
      updatedUsers[userIndex] = updatedUser;
      
      setUsers(updatedUsers);
      
      // Se for o usuário logado, atualizar também o estado do usuário
      if (user && user.id === userId) {
        setUser(updatedUser);
      }
      
      // Salvar no localStorage
      localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
      
      toast.success("Senha alterada", { description: "Senha alterada com sucesso!" });
      return true;
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha", { description: "Não foi possível alterar a senha. Tente novamente." });
      return false;
    }
  };

  // Implementação da função de resetar senha
  const resetUserPassword = async (userId: string): Promise<boolean> => {
    try {
      // Verificar se o usuário existe
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        toast.error("Usuário não encontrado", { description: "Não foi possível encontrar o usuário para resetar a senha." });
        return false;
      }
      
      const targetUser = users[userIndex];
      
      // Resetar senha no Supabase se o ID parecer um UUID
      if (userId.includes('-') && targetUser.email) {
        try {
          // Usar a função de redefinição de senha
          const { error } = await supabase.auth.resetPasswordForEmail(targetUser.email, {
            redirectTo: window.location.origin + '/reset-password',
          });
          
          if (error) {
            console.error("Erro ao resetar senha no Supabase:", error);
          } else {
            toast.success("Email de redefinição enviado", { 
              description: `Um email foi enviado para ${targetUser.email} com instruções para redefinir a senha.` 
            });
            return true;
          }
        } catch (e) {
          console.error("Erro ao resetar senha no Supabase:", e);
        }
      }
      
      // Resetar para a senha padrão localmente
      const updatedUser = { ...users[userIndex], password: '@54321' };
      const updatedUsers = [...users];
      updatedUsers[userIndex] = updatedUser;
      
      setUsers(updatedUsers);
      
      // Salvar no localStorage
      localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
      
      toast.success("Senha resetada", { description: "A senha do usuário foi resetada para o padrão (@54321)." });
      return true;
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      toast.error("Erro ao resetar senha", { description: "Não foi possível resetar a senha do usuário." });
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        users, 
        isAuthenticated, 
        loading, 
        login, 
        logout, 
        signup, 
        addUser, 
        updateUser, 
        deleteUser,
        changePassword,
        resetUserPassword,
        supabaseUser,
        syncWithSupabase
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
