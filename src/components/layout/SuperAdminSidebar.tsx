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
  const collapsed = state === "collapsed";
  const location = useLocation();

  // Função para verificar se a rota está ativa
  const isActive = (href: string) => {
    if (href === '/superadmin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };


  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="p-2 bg-gradient-primary rounded-lg shadow-soft">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg text-foreground">SuperAdmin</h2>
                <p className="text-sm text-muted-foreground">Painel de Controle</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegação Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title} className={`${collapsed ? 'px-3 py-3 justify-center gap-0' : 'px-3 py-2 gap-1'} ${
                    isActive(item.url)
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-soft'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    <NavLink 
                      to={item.url} 
                      end={item.exact}
                    >
                      {collapsed ? (
                        <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                      ) : (
                        <>
                          <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                          <span className="font-medium">{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer Section */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t">
            <div className="text-xs text-muted-foreground text-center">
              <p>Platinum v1.0.0</p>
              <p className="text-[10px] opacity-70">Super Admin</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}