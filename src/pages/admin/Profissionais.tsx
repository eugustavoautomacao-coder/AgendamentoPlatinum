import { User, Plus, Clock, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/layout/AdminLayout";

const Profissionais = () => {
  const professionals = [
    {
      id: 1,
      name: "Ana Costa",
      photo: "/placeholder-professional-1.jpg",
      specialties: ["Corte", "Escova", "Coloração"],
      schedule: "Seg-Sex: 9h-18h",
      rating: 4.8,
      totalServices: 245
    },
    {
      id: 2,
      name: "Carlos Lima", 
      photo: "/placeholder-professional-2.jpg",
      specialties: ["Barba", "Corte Masculino"],
      schedule: "Ter-Sab: 10h-19h",
      rating: 4.9,
      totalServices: 189
    },
    {
      id: 3,
      name: "Lucia Santos",
      photo: "/placeholder-professional-3.jpg", 
      specialties: ["Manicure", "Pedicure", "Nail Art"],
      schedule: "Seg-Sex: 8h-17h",
      rating: 4.7,
      totalServices: 312
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe do seu salão
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Profissional
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">3</div>
              <p className="text-xs text-muted-foreground">ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avaliação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">4.8</div>
              <p className="text-xs text-muted-foreground">de 5 estrelas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Serviços Realizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">746</div>
              <p className="text-xs text-muted-foreground">este mês</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Equipe
            </CardTitle>
            <CardDescription>
              Todos os profissionais do salão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {professionals.map((professional) => (
                <Card key={professional.id} className="bg-gradient-card border border-border hover:shadow-soft transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={professional.photo} />
                        <AvatarFallback className="bg-primary-soft text-primary text-lg">
                          {professional.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {professional.name}
                        </h3>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="text-sm text-muted-foreground">
                            {professional.rating}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 w-full">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {professional.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {professional.schedule}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {professional.totalServices} serviços realizados
                        </div>
                      </div>

                      <div className="flex gap-2 w-full">
                        <Button size="sm" variant="outline" className="flex-1">
                          Ver Agenda
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Profissionais;