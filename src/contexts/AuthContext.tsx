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
  addUser: (userData: { name: string; cpf: string; role: 'user' | 'master' }) => Promise<boolean>;
  resetUserPassword: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  users: [],
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  addUser: async () => false,
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
        setUsers(parsedUsers);
      } catch (error) {
        console.error('Error parsing users from localStorage:', error);
      }
    } else {
      setUsers([defaultMasterUser]);
      localStorage.setItem('users', JSON.stringify([defaultMasterUser]));
    }
  }, []);

  const login = async (cpf: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.cpf === cpf);
    
    if (foundUser && password === '@54321') {
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

  const addUser = async (userData: { name: string; cpf: string; role: 'user' | 'master' }): Promise<boolean> => {
    if (users.some(u => u.cpf === userData.cpf)) {
      toast({
        title: "Erro",
        description: "Já existe um usuário com este CPF",
        variant: "destructive",
      });
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      cpf: userData.cpf,
      email: `${userData.cpf}@example.com`,
      role: userData.role,
      permissions: []
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

  const resetUserPassword = (userId: string) => {
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
      resetUserPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
