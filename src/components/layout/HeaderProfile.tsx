import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function HeaderProfile() {
  try {
    const { signOut, profile } = useAuth();
    const { toast } = useToast();

    // Função para extrair apenas o primeiro nome
    const getFirstName = (fullName: string) => {
      return fullName?.split(' ')[0] || fullName;
    };

    const handleLogout = async () => {
      try {
        // Mostrar feedback imediato para o usuário
        toast({
          title: "Fazendo logout...",
          description: "Aguarde um momento.",
          className: 'toast-info-gradient'
        });
        
        await signOut();
        // O redirecionamento será feito automaticamente pelo App.tsx
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        // Mesmo com erro, o signOut já trata a limpeza local
      }
    };

    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary-soft text-primary text-xs sm:text-sm">
                {profile?.nome?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <div className="px-2 py-1.5 border-b">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">{getFirstName(profile?.nome || 'Usuário')}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.tipo || 'Usuário'}</p>
            </div>
            <DropdownMenuItem asChild>
              <Link to="/perfil" className="cursor-pointer text-xs sm:text-sm">
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive cursor-pointer text-xs sm:text-sm"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
          title="Sair"
        >
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    );
  } catch (error) {
    console.error('Erro no HeaderProfile:', error);
    return null;
  }
}
