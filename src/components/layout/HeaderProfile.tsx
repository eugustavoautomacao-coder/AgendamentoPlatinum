import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

export function HeaderProfile() {
  const { signOut, profile } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary-soft text-primary text-sm">
              {profile?.nome?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 border-b">
            <p className="text-sm font-medium text-foreground">{profile?.nome || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">{profile?.role}</p>
          </div>
          <DropdownMenuItem asChild>
            <Link to="/perfil" className="cursor-pointer">
              Meu Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={signOut} 
            className="text-destructive cursor-pointer"
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={signOut}
        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
