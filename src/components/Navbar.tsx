
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Building, 
  LogOut, 
  User,
  Menu,
  Building2,
  FileText,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5 mr-2" /> },
    { name: 'Ações', path: '/actions', icon: <CheckSquare className="h-5 w-5 mr-2" /> },
    { name: 'Workflow', path: '/workflow', icon: <FileText className="h-5 w-5 mr-2" /> },
    { name: 'Clientes', path: '/clients', icon: <Users className="h-5 w-5 mr-2" /> },
    { name: 'Responsáveis', path: '/responsibles', icon: <User className="h-5 w-5 mr-2" /> },
    { name: 'Empresa', path: '/company', icon: <Building className="h-5 w-5 mr-2" /> },
  ];
  
  if (user?.role === 'master') {
    navItems.push({ name: 'Usuários', path: '/users', icon: <Users className="h-5 w-5 mr-2" /> });
  }

  const closeSheet = () => setIsOpen(false);
  
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/bbef40c8-e0f3-4855-872c-98b10feabdd5.png" 
              alt="Total Data Logo" 
              className="h-8 w-auto" 
            />
            <span className="font-bold hidden md:inline-block">Gerenciador de Ações</span>
          </Link>
        </div>
        
        {isMobile ? (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="ml-auto">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="grid gap-4 py-4">
                <div className="px-2 py-1 mb-4 flex items-center">
                  <img 
                    src="/lovable-uploads/bbef40c8-e0f3-4855-872c-98b10feabdd5.png" 
                    alt="Total Data Logo" 
                    className="h-10 mr-3" 
                  />
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Menu</h3>
                    {user && (
                      <p className="text-sm text-muted-foreground">
                        Logado como {user.name}
                      </p>
                    )}
                  </div>
                </div>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeSheet}
                    className={`flex items-center px-2 py-1 text-base transition-colors hover:bg-muted rounded-md ${
                      location.pathname === item.path ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start px-2 py-1"
                  onClick={() => {
                    logout();
                    closeSheet();
                  }}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="ml-auto flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 flex items-center text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-4">
                  <User className="h-5 w-5 mr-2" />
                  {user?.name || 'Usuário'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
