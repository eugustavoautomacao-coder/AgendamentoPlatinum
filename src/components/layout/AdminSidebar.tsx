import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  BarChart3,
  Settings,
  User,
  Sparkles,
  Package,
  MessageSquare,
  DollarSign,
  TrendingUp,
  ChevronDown
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
  hasSubmenu?: boolean;
  submenu?: MenuItem[];
}

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [submenuTop, setSubmenuTop] = useState<number | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [submenuAsDropdown, setSubmenuAsDropdown] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { salonName } = useSalonInfo();

  useEffect(() => {
    return () => {
      // Cleanup dos timeouts
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const handleMouseEnter = (itemTitle: string, event: React.MouseEvent<HTMLDivElement>) => {
    // Limpar timeout anterior se existir
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    setHoveredItem(itemTitle);
    setSubmenuAsDropdown(window.innerWidth <= 502);
    // Calcular posição vertical do item para alinhar o submenu
    try {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      setSubmenuTop(rect.top + rect.height / 2);
    } catch {
      setSubmenuTop(null);
    }
  };


  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navegar sem expandir a sidebar
    navigate(href);
  };

  const handleMouseLeave = () => {
    // Adicionar delay antes de fechar o menu
    const timeout = setTimeout(() => {
      setHoveredItem(null);
      setSubmenuTop(null);
    }, 300); // 300ms de delay
    
    setHoverTimeout(timeout);
  };

  // Memoize items to avoid re-renders while typing elsewhere
  const menuItems: MenuItem[] = [
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
      href: "/admin/funcionarios"
    },
    {
      title: "Serviços",
      icon: Scissors,
      href: "/admin/servicos"
    },
    {
      title: "Produtos",
      icon: Package,
      href: "/admin/produtos"
    },
    {
      title: "Solicitações",
      icon: MessageSquare,
      href: "/admin/solicitacoes"
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      href: "/admin/relatorios",
      hasSubmenu: true,
      submenu: [
        {
          title: "Relatórios Gerais",
          icon: BarChart3,
          href: "/admin/relatorios"
        },
        {
          title: "Comissões",
          icon: DollarSign,
          href: "/admin/comissoes-mensais"
        },
      ]
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

  const isSubmenuActive = (item: MenuItem) => {
    if (!item.hasSubmenu) return false;
    return item.submenu!.some((subItem: MenuItem) => isActive(subItem.href));
  };

  // Função para verificar se o item principal está ativo
  const isItemActive = (item: MenuItem) => {
    const isSelfActive = isActive(item.href, Boolean(item.exact));
    return isSelfActive || isSubmenuActive(item);
  };

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-64"} transition-all duration-300`} collapsible="icon">
      <SidebarContent className="overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="p-2 bg-gradient-primary rounded-lg shadow-soft">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg text-foreground">
                  {salonName}
                </h2>
                <p className="text-sm text-muted-foreground">Administrador</p>
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
                <SidebarMenuItem key={item.href}>
                  {item.hasSubmenu ? (
                    // Item com submenu
                    <div
                      className="relative"
                      onMouseEnter={(e) => handleMouseEnter(item.title, e)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div
                        className={`flex items-center gap-3 rounded-lg transition-all duration-200 group cursor-pointer ${
                          collapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2.5'
                        } ${
                          isItemActive(item)
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-soft'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                        {!collapsed && (
                          <>
                            <span className="font-medium flex-1">{item.title}</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                              hoveredItem === item.title ? 'rotate-180' : ''
                            }`} />
                          </>
                        )}
                        
                        {/* Flyout Menu */}
                        {hoveredItem === item.title && createPortal(
                          submenuAsDropdown ? (
                            <div
                              className="absolute left-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-elegant py-2 min-w-max"
                              style={{ zIndex: 999999 }}
                              onMouseEnter={() => {
                                if (hoverTimeout) {
                                  clearTimeout(hoverTimeout);
                                  setHoverTimeout(null);
                                }
                              }}
                              onMouseLeave={() => {
                                const timeout = setTimeout(() => {
                                  setHoveredItem(null);
                                }, 300);
                                setHoverTimeout(timeout);
                              }}
                            >
                              {item.submenu!.map((subItem: MenuItem) => (
                                <NavLink
                                  key={subItem.href}
                                  to={subItem.href}
                                  onClick={(e) => handleNavigation(subItem.href, e)}
                                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200 hover:bg-accent ${
                                    isActive(subItem.href)
                                      ? 'text-primary bg-primary/10'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <subItem.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                                  <span>{subItem.title}</span>
                                </NavLink>
                              ))}
                            </div>
                          ) : (
                            <div 
                              className="fixed inset-0 pointer-events-none"
                              style={{ zIndex: 999998 }}
                              onMouseLeave={() => {
                                const timeout = setTimeout(() => {
                                  setHoveredItem(null);
                                }, 300);
                                setHoverTimeout(timeout);
                              }}
                            >
                              <div 
                                className={`fixed ${collapsed ? 'left-14' : 'left-64'} w-48 bg-card border border-border rounded-lg shadow-elegant py-2 min-w-max ml-2 pointer-events-auto`}
                                style={{
                                  top: submenuTop !== null ? `${submenuTop}px` : '50%',
                                  transform: submenuTop !== null ? 'translateY(-50%)' : 'translateY(-50%)',
                                  zIndex: 999999
                                }}
                                onMouseEnter={() => {
                                  // Limpar timeout quando mouse entra no flyout
                                  if (hoverTimeout) {
                                    clearTimeout(hoverTimeout);
                                    setHoverTimeout(null);
                                  }
                                }}
                                onMouseLeave={() => {
                                  // Adicionar delay quando mouse sai do flyout
                                  const timeout = setTimeout(() => {
                                    setHoveredItem(null);
                                  }, 300);
                                  setHoverTimeout(timeout);
                                }}
                              >
                                {/* Seta visual */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-card border-r border-t border-border transform -rotate-45"></div>
                                {item.submenu!.map((subItem: MenuItem) => (
                                  <NavLink
                                    key={subItem.href}
                                    to={subItem.href}
                                    onClick={(e) => handleNavigation(subItem.href, e)}
                                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200 hover:bg-accent ${
                                      isActive(subItem.href)
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    <subItem.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                                    <span>{subItem.title}</span>
                                  </NavLink>
                                ))}
                              </div>
                            </div>
                          ),
                          document.body
                        )}
                      </div>
                    </div>
                  ) : (
                    // Item normal
                    <SidebarMenuButton asChild tooltip={item.title} className={`${collapsed ? 'px-3 py-3 justify-center gap-0' : 'px-3 py-2.5 gap-3'} ${
                      isItemActive(item)
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-soft'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}>
                      <NavLink
                        to={item.href}
                        onClick={(e) => handleNavigation(item.href, e)}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
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
              <p className="text-[10px] opacity-70">Sistema de Gestão</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;