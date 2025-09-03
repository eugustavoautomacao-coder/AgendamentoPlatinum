import { Calendar, Clock, Users, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProfissionalLayout from "@/components/layout/ProfissionalLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useAuth } from "@/hooks/useAuth";
import { isToday } from "date-fns";

const Agenda = () => {
  const { profile } = useAuth();
  const { appointments, loading } = useAppointments();
  const myAppointments = appointments.filter(apt => apt.professional_id === profile?.id);
  const todayAppointments = myAppointments.filter(apt => isToday(new Date(apt.start_time)));

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

  if (loading) {
    return (
      <ProfissionalLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando agenda...</p>
          </div>
        </div>
      </ProfissionalLayout>
    );
  }

  return (
    <ProfissionalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
              <p className="text-muted-foreground">
                Gerencie seus agendamentos e horários
              </p>
            </div>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>
          {/* ...outros cards e listagem de agendamentos, igual ao admin, filtrando pelo profissional */}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Meus Agendamentos de Hoje</CardTitle>
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
                      <div className="text-sm font-medium text-foreground">{appointment.time}</div>
                      <div className="text-xs text-muted-foreground">{appointment.duration}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{appointment.client_name}</div>
                      <div className="text-sm text-muted-foreground">{appointment.service_name}</div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Editar</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProfissionalLayout>
  );
};

export default Agenda; 