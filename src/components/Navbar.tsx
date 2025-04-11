
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-primary sticky top-0 z-50 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold">
            Gestão de Ações
          </Link>
        </div>

        {isMobile ? (
          <>
            <Button variant="ghost" onClick={toggleMenu} className="p-1 text-white">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
            
            {isMenuOpen && (
              <div className="absolute top-16 right-0 left-0 bg-primary p-4 flex flex-col gap-2 shadow-lg">
                <Link 
                  to="/dashboard" 
                  className="block py-2 hover:bg-primary/80 rounded px-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/actions" 
                  className="block py-2 hover:bg-primary/80 rounded px-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ações
                </Link>
                <Link 
                  to="/clients" 
                  className="block py-2 hover:bg-primary/80 rounded px-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Clientes
                </Link>
                <Link 
                  to="/responsibles" 
                  className="block py-2 hover:bg-primary/80 rounded px-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Responsáveis
                </Link>
                <Link 
                  to="/company" 
                  className="block py-2 hover:bg-primary/80 rounded px-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Empresa
                </Link>
                {user && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center">
                      <User size={18} />
                      <span className="ml-2">{user.name}</span>
                    </div>
                    <Button variant="ghost" onClick={logout} className="p-1 text-white">
                      <LogOut size={18} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex space-x-4 items-center">
            <Link to="/dashboard" className="px-3 py-2 rounded hover:bg-primary/80">
              Dashboard
            </Link>
            <Link to="/actions" className="px-3 py-2 rounded hover:bg-primary/80">
              Ações
            </Link>
            <Link to="/clients" className="px-3 py-2 rounded hover:bg-primary/80">
              Clientes
            </Link>
            <Link to="/responsibles" className="px-3 py-2 rounded hover:bg-primary/80">
              Responsáveis
            </Link>
            <Link to="/company" className="px-3 py-2 rounded hover:bg-primary/80">
              Empresa
            </Link>
            {user && (
              <div className="flex items-center ml-4 pl-4 border-l border-white/30">
                <User size={18} />
                <span className="ml-2 mr-4">{user.name}</span>
                <Button variant="ghost" onClick={logout} className="p-1 text-white">
                  <LogOut size={18} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
