import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  Crown
} from "lucide-react";
import { NavLink } from "react-router-dom";
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
                  <NavLink 
                    to={item.url} 
                    end={item.exact}
                    className={({ isActive }) => 
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>
    </Sidebar>
  );
}