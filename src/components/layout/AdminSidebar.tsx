import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  BarChart3,
  Settings,
  User,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

interface AdminSidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const AdminSidebar = ({ isCollapsed = false, setIsCollapsed }: AdminSidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { signOut, profile } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      exact: true
    },
    {
      title: "Agenda",
      icon: Calendar,
      href: "/admin/agenda"
    },
    {
      title: "Clientes",
      icon: Users,
      href: "/admin/clientes"
    },
    {
      title: "Profissionais",
      icon: User,
      href: "/admin/profissionais"
    },
    {
      title: "Serviços",
      icon: Scissors,
      href: "/admin/servicos"
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      href: "/admin/relatorios"
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "/admin/configuracoes"
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const SidebarContent = ({ showLabels = true }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-6 ${isCollapsed ? 'px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-soft">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          {showLabels && !isCollapsed && (
            <div>
              <h2 className="font-bold text-lg text-foreground">Beauty Manager</h2>
              <p className="text-sm text-muted-foreground">Administrador</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className={`flex-1 space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 rounded-lg transition-all duration-200 group relative ${
              isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2.5'
            } ${
              isActive(item.href, item.exact)
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            onClick={() => setIsMobileOpen(false)}
            title={isCollapsed ? item.title : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-medium animate-fade-in">{item.title}</span>
            )}
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.title}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User Profile */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center mb-4 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary-soft text-primary">
              {profile?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{profile?.name || 'Usuário'}</p>
              <p className="text-sm text-muted-foreground truncate">{profile?.role}</p>
            </div>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={`w-full text-muted-foreground hover:text-destructive ${
            isCollapsed ? 'justify-center px-0' : 'justify-start'
          }`}
          onClick={signOut}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 transition-all duration-300 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        <div className="bg-card border-r border-border shadow-elegant h-screen">
          <div className="relative h-full">
            {/* Collapse Button */}
            {setIsCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-6 z-10 h-6 w-6 bg-card border border-border shadow-soft hover:bg-accent"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <SidebarContent showLabels={!isCollapsed} />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="bg-card border-r border-border shadow-elegant h-full">
          <SidebarContent showLabels={true} />
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;