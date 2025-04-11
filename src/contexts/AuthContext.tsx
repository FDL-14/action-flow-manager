
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { defaultMasterUser } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

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
    companyIds?: string[];
    permissions?: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canMarkComplete: boolean;
      canMarkDelayed: boolean;
      canAddNotes: boolean;
      canViewReports: boolean;
      viewAllActions: boolean;
      canEditUser?: boolean;
      canEditAction?: boolean;
    }
  }) => Promise<boolean>;
  updateUser: (userData: { 
    id: string;
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master';
    companyIds?: string[];
    permissions?: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canMarkComplete: boolean;
      canMarkDelayed: boolean;
      canAddNotes: boolean;
      canViewReports: boolean;
      viewAllActions: boolean;
      canEditUser?: boolean;
      canEditAction?: boolean;
    }
  }) => Promise<boolean>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => void;
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
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }

    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        
        // Ensure all users have an email field
        const updatedUsers = parsedUsers.map((u: User) => {
          if (!u.email) {
            return {
              ...u,
              email: `${u.cpf}@example.com` // Default email
            };
          }
          return u;
        });
        
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      } catch (error) {
        console.error('Error parsing users from localStorage:', error);
      }
    } else {
      // Add company ID to the default master user
      const updatedMasterUser = {
        ...defaultMasterUser,
        companyIds: ['1'],  // Default company ID
        email: 'admin@example.com' // Add default email
      };
      setUsers([updatedMasterUser]);
      localStorage.setItem('users', JSON.stringify([updatedMasterUser]));
    }
  }, []);

  const login = async (cpf: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.cpf === cpf);
    
    // Special case for the user with CPF 70635016150
    if (cpf === '70635016150' && password === '@54321') {
      // If user doesn't exist, create them
      if (!foundUser) {
        const newUser: User = {
          id: Date.now().toString(),
          name: "LEONARDO CARRIJO MARTINS",
          cpf: "70635016150",
          email: "leonardo@example.com",
          role: 'user',
          companyIds: ['1'],
          permissions: [
            {
              id: "default",
              name: "Default Permissions",
              description: "Default user permissions",
              canCreate: true,
              canEdit: true,
              canDelete: false,
              canMarkComplete: true,
              canMarkDelayed: true,
              canAddNotes: true,
              canViewReports: false,
              viewAllActions: false,
              canEditUser: false,
              canEditAction: true
            }
          ]
        };
        
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${newUser.name}!`,
          variant: "default",
        });
        return true;
      }
    }
    
    if (foundUser && (password === '@54321' || password === foundUser.password)) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(foundUser));
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${foundUser.name}!`,
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

  const logout = () => {
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
    companyIds?: string[];
    permissions?: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canMarkComplete: boolean;
      canMarkDelayed: boolean;
      canAddNotes: boolean;
      canViewReports: boolean;
      viewAllActions: boolean;
      canEditUser?: boolean;
      canEditAction?: boolean;
    }
  }): Promise<boolean> => {
    if (users.some(u => u.cpf === userData.cpf)) {
      toast({
        title: "Erro",
        description: "Já existe um usuário com este CPF",
        variant: "destructive",
      });
      return false;
    }

    // Default permissions if not provided
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
    };

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      cpf: userData.cpf,
      email: userData.email || `${userData.cpf}@example.com`,
      role: userData.role,
      companyIds: userData.companyIds || ['1'], // Default company ID
      permissions: [
        {
          id: "default",
          name: "Default Permissions",
          description: "Default user permissions",
          ...userData.permissions || defaultPermissions
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

  const updateUser = async (userData: { 
    id: string;
    name: string; 
    cpf: string; 
    email: string;
    role: 'user' | 'master';
    companyIds?: string[];
    permissions?: {
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canMarkComplete: boolean;
      canMarkDelayed: boolean;
      canAddNotes: boolean;
      canViewReports: boolean;
      viewAllActions: boolean;
      canEditUser?: boolean;
      canEditAction?: boolean;
    }
  }): Promise<boolean> => {
    // Check if trying to update to a CPF that already exists in another user
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
        // Default permissions if not provided
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
        };

        return {
          ...user,
          name: userData.name,
          cpf: userData.cpf,
          email: userData.email || user.email,
          role: userData.role,
          companyIds: userData.companyIds || user.companyIds || ['1'],
          permissions: [
            {
              id: "default",
              name: "Default Permissions",
              description: "Default user permissions",
              ...userData.permissions || defaultPermissions
            }
          ]
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Update current user if editing the logged-in user
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

    // Check if current password is correct (either default or user set)
    if (currentPassword !== '@54321' && currentPassword !== userToUpdate.password) {
      toast({
        title: "Erro",
        description: "Senha atual incorreta",
        variant: "destructive",
      });
      return false;
    }

    // Update the password
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

    // Update current user if changing own password
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
  };

  const resetUserPassword = (userId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          password: undefined // Reset to use default password
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
      resetUserPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
