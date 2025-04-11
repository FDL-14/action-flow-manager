
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { defaultMasterUser } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (cpf: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check localStorage for saved user session
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
  }, []);

  const login = async (cpf: string, password: string): Promise<boolean> => {
    // In a real app, this would make an API call
    if (cpf === defaultMasterUser.cpf && password === '@54321') {
      setUser(defaultMasterUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(defaultMasterUser));
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${defaultMasterUser.name}!`,
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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
