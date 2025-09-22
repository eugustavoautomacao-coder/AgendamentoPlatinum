import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Package,
  DollarSign,
  User,
  Sparkles
} from "lucide-react";
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
import { useSalonInfo } from "@/hooks/useSalonInfo";

interface MenuItem {
  title: string;
  icon: any;
  href: string;
  exact?: boolean;
}

const ProfissionalSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { salonName } = useSalonInfo();

  // Menu items específicos para profissionais
  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/profissional",
      exact: true
    },
    {
      title: "Minha Agenda",
      icon: Calendar,
      href: "/profissional/agenda"
    },
    {
      title: "Clientes",
      icon: Users,
      href: "/profissional/clientes"
    },
    {
      title: "Serviços",
      icon: Scissors,
      href: "/profissional/servicos"
    },
    {
      title: "Produtos",
      icon: Package,
      href: "/profissional/produtos"
    },
    {
      title: "Minhas Comissões",
      icon: DollarSign,
      href: "/profissional/comissoes"
    },
    {
      title: "Meu Perfil",
      icon: User,
      href: "/profissional/perfil"
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-64"} transition-all duration-300`} collapsible="icon">
      <SidebarContent className="overflow-y-auto transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b transition-colors duration-200">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="p-2 bg-gradient-primary rounded-lg shadow-soft transition-colors duration-200">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="transition-colors duration-200">
                <h2 className="font-bold text-lg text-foreground transition-colors duration-200">
                  {salonName || "AlveX"}
                </h2>
                <p className="text-sm text-muted-foreground transition-colors duration-200">Profissional</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="transition-colors duration-200">Navegação Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.title} className={`${collapsed ? 'px-3 py-3 justify-center gap-0' : 'px-3 py-2.5 gap-3'} ${
                    isActive(item.href, Boolean(item.exact))
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-soft'
                      : 'text-muted-foreground hover:text-foreground'
                  } transition-colors duration-200`}>
                    <NavLink to={item.href}>
                      <item.icon className="h-5 w-5 flex-shrink-0 text-primary transition-colors duration-200" />
                      {!collapsed && <span className="font-medium transition-colors duration-200">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer Section */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t transition-colors duration-200">
            <div className="text-xs text-muted-foreground text-center transition-colors duration-200">
              <p className="transition-colors duration-200">AlveX v1.0.0</p>
              <p className="text-[10px] opacity-70 transition-colors duration-200">Sistema de Gestão</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default ProfissionalSidebar;


