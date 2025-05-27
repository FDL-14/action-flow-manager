import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User, Permission } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null | undefined;
  users: User[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (userData: User) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => Promise<boolean>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  syncWithSupabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compute isAuthenticated and loading
  const isAuthenticated = user !== null && user !== undefined;
  const loading = isLoading;

  useEffect(() => {
    console.log('AuthProvider: Inicializando contexto de autenticação');
    
    // Initialize users with mock data
    setUsers(mockUsers);
    console.log('AuthProvider: Usuários carregados:', mockUsers.length);
    
    // Check for stored user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('AuthProvider: Usuário encontrado no localStorage:', parsedUser.name);
        setUser(parsedUser);
      } catch (error) {
        console.error('AuthProvider: Erro ao analisar usuário armazenado:', error);
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
    console.log('AuthProvider: Inicialização concluída');
  }, []);

  const createDefaultPermission = () => ({
    id: '',
    name: '',
    description: '',
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
    viewOnlyAssignedActions: false,
    canCreateUsersAdmin: true,
    canCreateUsersLimited: true,
    canCreateCompanies: true,
    canCreateClientsLimited: true,
    canCreateStages: true,
    canDownloadReportsLimited: true,
    canDeleteActionsLimited: true,
    canDeleteStages: true
  });

  const login = async (cpfOrEmail: string, password?: string): Promise<boolean> => {
    try {
      console.log('Login: Iniciando processo de login');
      console.log('Login: Input recebido:', cpfOrEmail);
      console.log('Login: Senha recebida:', password ? 'sim' : 'não');
      
      // Clean CPF from any formatting
      const cleanedInput = cpfOrEmail.replace(/\D/g, '');
      console.log('Login: CPF limpo:', cleanedInput);
      
      // Special check for master user - simplified logic
      if (cleanedInput === '80243088191' && password === '@54321') {
        console.log('Login: Usuário master detectado - autenticando diretamente');
        
        const masterUser = {
          id: "1",
          name: "Administrador",
          cpf: "80243088191",
          email: "admin@totaldata.com.br",
          role: "master" as const,
          companyIds: ["1"],
          password: "@54321",
          permissions: [
            {
              id: "1",
              name: "Master",
              description: "All permissions",
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
              viewOnlyAssignedActions: false,
              canCreateUsersAdmin: true,
              canCreateUsersLimited: true,
              canCreateCompanies: true,
              canCreateClientsLimited: true,
              canCreateStages: true,
              canDownloadReportsLimited: true,
              canDeleteActionsLimited: true,
              canDeleteStages: true
            }
          ]
        };
        
        console.log('Login: Definindo usuário master no estado');
        setUser(masterUser);
        localStorage.setItem('user', JSON.stringify(masterUser));
        
        // Force update users list to include master user if not present
        setUsers(prev => {
          const masterExists = prev.find(u => u.cpf.replace(/\D/g, '') === '80243088191');
          if (!masterExists) {
            return [...prev, masterUser];
          }
          return prev;
        });
        
        console.log('Login: Master user autenticado com sucesso');
        toast.success('Login realizado com sucesso!');
        return true;
      }
      
      // Try to find user by email or CPF in existing users
      const foundUser = users.find(u => {
        const userCpf = u.cpf.replace(/\D/g, '');
        return u.email === cpfOrEmail || userCpf === cleanedInput;
      });

      if (foundUser && foundUser.password === password) {
        console.log('Login: Usuário encontrado e autenticado:', foundUser.name);
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
        toast.success('Login realizado com sucesso!');
        return true;
      } else {
        console.log('Login: Credenciais inválidas para usuário:', cleanedInput);
        toast.error('CPF/Email ou senha incorretos');
        return false;
      }
    } catch (error) {
      console.error('Login: Erro no processo:', error);
      toast.error('Erro ao fazer login');
      return false;
    }
  };

  const logout = () => {
    console.log('Logout: Fazendo logout do usuário');
    setUser(null);
    localStorage.removeItem('user');
  };

  const addUser = useCallback(async (userData: Omit<User, 'id'>): Promise<boolean> => {
    try {
      const newUser: User = {
        id: Date.now().toString(),
        ...userData,
        permissions: userData.permissions.length > 0 ? userData.permissions : [createDefaultPermission()]
      };
      
      setUsers(prev => [...prev, newUser]);
      toast.success('Usuário adicionado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error('Erro ao adicionar usuário');
      return false;
    }
  }, []);

  const updateUser = useCallback(async (userData: User): Promise<boolean> => {
    try {
      setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
      if (user && user.id === userData.id) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      toast.success('Usuário atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      return false;
    }
  }, [user]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Usuário excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
      return false;
    }
  }, []);

  const resetUserPassword = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        toast.error('Usuário não encontrado');
        return false;
      }

      const updatedUser: User = {
        ...userToUpdate,
        password: '@54321',
        permissions: userToUpdate.permissions.length > 0 ? userToUpdate.permissions : [createDefaultPermission()]
      };

      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      return true;
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return false;
    }
  }, [users]);

  const changePassword = useCallback(async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        toast.error('Usuário não encontrado');
        return false;
      }

      if (userToUpdate.password !== currentPassword) {
        toast.error('Senha atual incorreta');
        return false;
      }

      const updatedUser: User = {
        ...userToUpdate,
        password: newPassword,
      };

      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      
      if (user && user.id === userId) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return false;
    }
  }, [users, user]);

  const syncWithSupabase = useCallback(async (): Promise<void> => {
    try {
      console.log('Sincronizando dados com Supabase...');
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Erro ao sincronizar com Supabase:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    users,
    isAuthenticated,
    loading,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    changePassword,
    syncWithSupabase,
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
