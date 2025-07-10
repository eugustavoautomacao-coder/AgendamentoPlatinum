import { Calendar, Clock, Users, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";

const Agenda = () => {
  const todayAppointments = [
    {
      id: 1,
      time: "09:00",
      client: "Maria Silva",
      service: "Corte + Escova",
      professional: "Ana Costa",
      status: "confirmado",
      duration: "90 min"
    },
    {
      id: 2,
      time: "10:30",
      client: "João Santos",
      service: "Barba",
      professional: "Carlos Lima",
      status: "pendente",
      duration: "45 min"
    },
    {
      id: 3,
      time: "14:00",
      client: "Fernanda Oliveira",
      service: "Manicure",
      professional: "Lucia Santos",
      status: "confirmado",
      duration: "60 min"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-success text-success-foreground';
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">
              Gerencie todos os agendamentos do salão
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">87</div>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Ocupação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">87%</div>
              <p className="text-xs text-muted-foreground">dos horários</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Agendamentos de Hoje
                </CardTitle>
                <CardDescription>
                  {todayAppointments.length} agendamentos para hoje
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">
                        {appointment.time}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {appointment.duration}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {appointment.client}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.service} • {appointment.professional}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Agenda;