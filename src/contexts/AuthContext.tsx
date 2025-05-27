


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
    // Simulate fetching users from an API or database
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setUsers(mockUsers);
    setIsLoading(false);
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
      // Clean CPF from any formatting
      const cleanedInput = cpfOrEmail.replace(/\D/g, '');
      
      // Check if it's the master user by CPF
      if (cleanedInput === '80243088191' && password === '@54321') {
        const masterUser = users.find(u => u.cpf.replace(/\D/g, '') === '80243088191');
        if (masterUser) {
          setUser(masterUser);
          localStorage.setItem('user', JSON.stringify(masterUser));
          toast.success('Login realizado com sucesso!');
          return true;
        }
      }
      
      // Try to find user by email or CPF
      const foundUser = users.find(u => {
        const userCpf = u.cpf.replace(/\D/g, '');
        return u.email === cpfOrEmail || userCpf === cleanedInput;
      });

      if (foundUser && foundUser.password === password) {
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
        toast.success('Login realizado com sucesso!');
        return true;
      } else {
        toast.error('CPF/Email ou senha incorretos');
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login');
      return false;
    }
  };

  const logout = () => {
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
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Usuário atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      return false;
    }
  }, []);

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
      // In a real app, this would make an API call to reset the password
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        toast.error('Usuário não encontrado');
        return false;
      }

      // Simulate password reset
      const updatedUser: User = {
        ...userToUpdate,
        password: '@54321', // Default password
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

      // Check if current password matches
      if (userToUpdate.password !== currentPassword) {
        toast.error('Senha atual incorreta');
        return false;
      }

      // Update password
      const updatedUser: User = {
        ...userToUpdate,
        password: newPassword,
      };

      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      
      // Update current user if changing own password
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
      // Simulate syncing with Supabase
      console.log('Sincronizando dados com Supabase...');
      // In a real implementation, this would sync local data with Supabase
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


