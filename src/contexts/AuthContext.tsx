
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
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Função para buscar usuários do localStorage ou do Supabase
  const fetchUsers = async () => {
    try {
      // Primeiro verifica se já existe no localStorage
      const localUsersStr = localStorage.getItem('appUsers');
      
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr) as User[];
        setUsers(localUsers);
        return;
      }
      
      // Se não tiver no localStorage, inicializa com os dados mock
      const mockUsersCopy = [...mockUsers];
      
      try {
        // Também tenta buscar do Supabase, se tiver acesso
        const { data: supabaseUsers, error } = await supabase
          .from('profiles')
          .select('*');
          
        if (error) {
          console.error('Erro ao buscar usuários do Supabase:', error);
        } else if (supabaseUsers) {
          console.log('Usuários encontrados no Supabase:', supabaseUsers);
          
          // Mapeia os dados do Supabase para o formato User
          const formattedUsers: User[] = supabaseUsers.map(u => ({
            id: u.id,
            name: u.name,
            cpf: u.cpf || '',
            email: u.email || '',
            role: u.role as 'user' | 'master',
            companyIds: u.company_ids || [],
            permissions: [],
            // Outros campos necessários
          }));
          
          // Mescla os usuários mock com os do Supabase
          // const mergedUsers = [...formattedUsers, ...mockUsersCopy];
          // setUsers(mergedUsers);
          // localStorage.setItem('appUsers', JSON.stringify(mergedUsers));
          
          // Por enquanto vamos usar apenas os mock para evitar problemas
          setUsers(mockUsersCopy);
          localStorage.setItem('appUsers', JSON.stringify(mockUsersCopy));
          return;
        }
      } catch (e) {
        console.log('Erro ao buscar usuários do Supabase, usando mock data:', e);
      }
      
      // Se falhar, usa apenas os mock
      setUsers(mockUsersCopy);
      localStorage.setItem('appUsers', JSON.stringify(mockUsersCopy));
      
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsers(mockUsers);
    }
  };

  // Verificar se existe um usuário autenticado no localStorage ao inicializar
  useEffect(() => {
    const checkAuthState = () => {
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
        } else if (storedCpf) {
          fetchUsers().then(() => {
            const foundUser = users.find(u => u.cpf === storedCpf);
            
            if (foundUser) {
              setUser(foundUser);
              setIsAuthenticated(true);
            } else {
              // Usuário não encontrado, limpar localStorage
              localStorage.removeItem('userAuthenticated');
              localStorage.removeItem('userCPF');
              localStorage.removeItem('userRole');
              localStorage.removeItem('userName');
              setIsAuthenticated(false);
            }
          });
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
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
      
      // Limpar o CPF para busca (remover formatação)
      const cleanedCpf = cpf.replace(/\D/g, '');
      console.log("CPF limpo para autenticação:", cleanedCpf);
      
      // Verificar nos usuários mockados/localStorage
      const foundUser = users.find(u => u.cpf === cleanedCpf);
      
      if (foundUser && foundUser.password === password) {
        setUser(foundUser);
        setIsAuthenticated(true);
        
        // Salvar dados no localStorage
        localStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('userCPF', foundUser.cpf);
        localStorage.setItem('userRole', foundUser.role);
        localStorage.setItem('userName', foundUser.name);
        
        return true;
      }
      
      // Verificar no Supabase se não encontrou nos mocks
      try {
        // Implementação para buscar do Supabase
        // Para implementar depois
      } catch (e) {
        console.error("Erro ao verificar usuário no Supabase:", e);
      }
      
      return false; // Login inválido
    } catch (error) {
      console.error("Erro durante o processo de login:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    // Limpar o localStorage e estado
    localStorage.removeItem('userAuthenticated');
    localStorage.removeItem('userCPF');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const signup = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    try {
      // Verificar se já existe usuário com este CPF
      const userExists = users.some(u => u.cpf === userData.cpf);
      
      if (userExists) {
        toast.error("CPF já cadastrado", { description: "Este CPF já está sendo usado por outro usuário." });
        return false;
      }
      
      // Criar novo usuário
      const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`
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
    try {
      // Verificar se já existe usuário com este CPF
      const userExists = users.some(u => u.cpf === userData.cpf);
      
      if (userExists) {
        toast.error("CPF já cadastrado", { description: "Este CPF já está sendo usado por outro usuário." });
        return false;
      }
      
      // Criar novo usuário
      const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`
      };
      
      console.log("Adicionando usuário", newUser.name, "(CPF:", newUser.cpf, ") ao localStorage");
      
      // Atualizar a lista de usuários
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      
      // Salvar no localStorage
      localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
      
      toast.success("Usuário adicionado", { description: "Usuário adicionado com sucesso!" });
      return true;
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      toast.error("Erro ao adicionar", { description: "Não foi possível adicionar o usuário." });
      return false;
    }
  };

  const updateUser = async (updatedUser: User): Promise<boolean> => {
    try {
      const userIndex = users.findIndex(u => u.id === updatedUser.id);
      
      if (userIndex === -1) {
        toast.error("Usuário não encontrado", { description: "Não foi possível encontrar o usuário para atualização." });
        return false;
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
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
