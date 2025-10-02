import { Users, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NoProfessionalsMessageProps {
  className?: string;
}

export const NoProfessionalsMessage = ({ className = "" }: NoProfessionalsMessageProps) => {
  const navigate = useNavigate();

  const handleGoToProfessionals = () => {
    navigate('/admin/funcionarios');
  };

  return (
    <div className={`flex items-center justify-center min-h-96 ${className}`}>
      <Card className="w-full max-w-md text-center border-border">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl text-foreground">
            Você ainda não possui profissionais cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Para começar a usar a agenda, você precisa cadastrar pelo menos um profissional.
          </p>
          <Button 
            onClick={handleGoToProfessionals}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Profissional
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
