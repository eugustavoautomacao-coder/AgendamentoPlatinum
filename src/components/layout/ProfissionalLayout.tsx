import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import ProfissionalSidebar from "./ProfissionalSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface ProfissionalLayoutProps {
  children: ReactNode;
}

const ProfissionalLayout = ({ children }: ProfissionalLayoutProps) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  // Função para extrair apenas o primeiro nome
  const getFirstName = (fullName: string) => {
    return fullName?.split(' ')[0] || fullName;
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full transition-colors duration-200">
        {/* Sidebar */}
        <ProfissionalSidebar />
        
        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col transition-colors duration-200">
          {/* Header */}
          <header className="h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-colors duration-200">
            <div className="flex h-full items-center justify-between px-4 w-full">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9 transition-colors duration-200" />
                <div className="hidden md:block">
                  <h1 className="text-lg font-semibold transition-colors duration-200">Área do Profissional</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ThemeToggle size="sm" />
                
                {/* Foto do Profissional */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/profissional/perfil")}
                  className="flex items-center gap-2 transition-colors duration-200 p-1"
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.nome || "Profissional"} 
                      className="w-8 h-8 rounded-full object-cover border border-border hover:border-primary transition-colors duration-200" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold border border-border hover:border-primary transition-colors duration-200">
                      {profile?.nome ? profile.nome.split(' ').map(n => n[0]).join('').slice(0,2) : "P"}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium">
                    {getFirstName(profile?.nome || "Profissional")}
                  </span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-destructive hover:text-destructive transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 min-w-0 overflow-x-hidden transition-colors duration-200">
            <div className="p-4 lg:p-6 xl:p-8 bg-background min-w-0 overflow-x-hidden w-full max-w-none transition-colors duration-200">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProfissionalLayout;




