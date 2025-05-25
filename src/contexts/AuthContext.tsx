import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User, Permission } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null | undefined;
  users: User[];
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (userData: User) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (email: string, password?: string): Promise<boolean> => {
    // Simulate authentication logic
    const foundUser = users.find(u => u.email === email);

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    } else {
      toast.error('Credenciais inválidas');
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

  const value: AuthContextType = {
    user,
    users,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    resetUserPassword,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
