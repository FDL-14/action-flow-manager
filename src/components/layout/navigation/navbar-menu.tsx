
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

type NavLink = {
  title: string;
  href: string;
  description?: string;
};

const dashboardLinks: NavLink[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Visão geral do sistema",
  },
  {
    title: "Ações",
    href: "/actions",
    description: "Gerenciamento de ações",
  },
  {
    title: "Workflow",
    href: "/workflow",
    description: "Visualização de fluxo de trabalho",
  },
  {
    title: "Clientes",
    href: "/clients",
    description: "Gerenciamento de clientes",
  },
  {
    title: "Responsável/Solicitante",
    href: "/responsibles",
    description: "Gerenciamento de responsáveis e solicitantes",
  },
  {
    title: "Empresa",
    href: "/companies",
    description: "Gerenciamento de empresas",
  },
  {
    title: "Usuários",
    href: "/users",
    description: "Gerenciamento de usuários",
  },
];

export function NavbarMenu() {
  const location = useLocation();
  
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {dashboardLinks.map((link) => (
                <ListItem
                  key={link.title}
                  title={link.title}
                  href={link.href}
                  active={location.pathname === link.href}
                >
                  {link.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/actions" className={cn(navigationMenuTriggerStyle())}>
            Ações
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/workflow" className={cn(navigationMenuTriggerStyle())}>
            Workflow
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/clients" className={cn(navigationMenuTriggerStyle())}>
            Clientes
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/responsibles" className={cn(navigationMenuTriggerStyle())}>
            Responsável/Solicitante
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/companies" className={cn(navigationMenuTriggerStyle())}>
            Empresa
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { active?: boolean }
>(({ className, title, active, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
            active
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent hover:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
