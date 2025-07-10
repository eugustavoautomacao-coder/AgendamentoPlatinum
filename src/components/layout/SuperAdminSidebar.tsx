import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  Crown
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/superadmin",
    icon: LayoutDashboard,
    exact: true
  },
  {
    title: "Salões",
    url: "/superadmin/saloes",
    icon: Building2
  },
  {
    title: "Usuários",
    url: "/superadmin/usuarios",
    icon: Users
  },
  {
    title: "Assinaturas",
    url: "/superadmin/assinaturas",
    icon: CreditCard
  },
  {
    title: "Relatórios",
    url: "/superadmin/relatorios",
    icon: BarChart3
  },
  {
    title: "Configurações",
    url: "/superadmin/configuracoes",
    icon: Settings
  }
];

export function SuperAdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getNavClass = (path: string, exact = false) => {
    return isActive(path, exact) 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-accent hover:text-accent-foreground";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        {!collapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg shadow-soft">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">SuperAdmin</h2>
                <p className="text-sm text-muted-foreground">Painel de Controle</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegação Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url, item.exact)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile */}
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-soft text-primary text-xs">
                {profile?.name?.charAt(0) || 'SA'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate text-sm">
                  {profile?.name || 'SuperAdmin'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.role || 'superadmin'}
                </p>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            {!collapsed && <span className="text-xs">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}