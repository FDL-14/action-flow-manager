
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
      canEditUser?: boolean;
      canEditAction?: boolean;
      canEditClient?: boolean;
      canDeleteClient?: boolean;
      viewOnlyAssignedActions?: boolean;
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
      canEditUser?: boolean;
      canEditAction?: boolean;
      canEditClient?: boolean;
      canDeleteClient?: boolean;
      viewOnlyAssignedActions?: boolean;
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
        
        const updatedUsers = parsedUsers.map((u: User) => {
          // Ensure users have proper email, companyIds, clientIds
          const updatedUser = {
            ...u,
            email: u.email || `${u.cpf}@example.com`,
            companyIds: u.companyIds || ['1'],
            clientIds: u.clientIds || []
          };
          return updatedUser;
        });
        
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      } catch (error) {
        console.error('Error parsing users from localStorage:', error);
      }
    } else {
      const updatedMasterUser = {
        ...defaultMasterUser,
        companyIds: ['1'],
        clientIds: [],
        email: 'admin@example.com'
      };
      setUsers([updatedMasterUser]);
      localStorage.setItem('users', JSON.stringify([updatedMasterUser]));
    }
  }, []);

  const login = async (cpf: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.cpf === cpf);
    
    if ((cpf === '70635016150' || cpf === '80243088191') && password === '@54321') {
      if (!foundUser) {
        const defaultName = cpf === '70635016150' ? "LEONARDO CARRIJO MARTINS" : "USUÁRIO TESTE";
        const defaultEmail = cpf === '70635016150' ? "leonardo@example.com" : "teste@example.com";
        
        const newUser: User = {
          id: Date.now().toString(),
          name: defaultName,
          cpf: cpf,
          email: defaultEmail,
          role: 'user',
          companyIds: ['1'],
          clientIds: [],
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
      canEditUser?: boolean;
      canEditAction?: boolean;
      canEditClient?: boolean;
      canDeleteClient?: boolean;
      viewOnlyAssignedActions?: boolean;
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
      canEditUser?: boolean;
      canEditAction?: boolean;
      canEditClient?: boolean;
      canDeleteClient?: boolean;
      viewOnlyAssignedActions?: boolean;
    }
  }): Promise<boolean> => {
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
          viewOnlyAssignedActions: userData.role !== 'master' && !userData.permissions?.viewAllActions,
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
              ...userData.permissions || defaultPermissions
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
  };

  const resetUserPassword = (userId: string) => {
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
