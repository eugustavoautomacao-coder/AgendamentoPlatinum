import { Calendar, Users, Scissors, DollarSign, TrendingUp, Clock, Star, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useServices } from "@/hooks/useServices";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminDashboard = () => {
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { clients, loading: clientsLoading } = useClients();
  const { professionals, loading: professionalsLoading } = useProfessionals();
  const { services, loading: servicesLoading } = useServices();

  // Calculate stats from real data
  const todayAppointments = appointments.filter(apt => 
    isToday(new Date(apt.start_time))
  );
  
  const thisMonthRevenue = appointments
    .filter(apt => apt.status === 'concluido' && apt.final_price)
    .reduce((sum, apt) => sum + (apt.final_price || 0), 0);

  const stats = [
    {
      title: "Agendamentos Hoje",
      value: todayAppointments.length.toString(),
      icon: Calendar,
      description: `${todayAppointments.filter(apt => apt.status === 'confirmado').length} confirmados`,
      trend: "up"
    },
    {
      title: "Receita do Mês",
      value: `R$ ${thisMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Serviços concluídos",
      trend: "up"
    },
    {
      title: "Clientes Ativos",
      value: clients.length.toString(),
      icon: Users,
      description: "Total cadastrados",
      trend: "up"
    },
    {
      title: "Profissionais",
      value: professionals.length.toString(),
      icon: TrendingUp,
      description: "Ativos no salão",
      trend: "neutral"
    }
  ];

  // Get next appointments (today and tomorrow)
  const nextAppointments = appointments
    .filter(apt => 
      (isToday(new Date(apt.start_time)) || isTomorrow(new Date(apt.start_time))) &&
      apt.status !== 'cancelado'
    )
    .slice(0, 5)
    .map(apt => ({
      id: apt.id,
      time: format(new Date(apt.start_time), 'HH:mm', { locale: ptBR }),
      client: apt.client_name || 'Cliente',
      service: apt.service_name || 'Serviço',
      professional: apt.professional_name || 'Profissional',
      status: apt.status,
      duration: `${apt.service_duration || 60} min`
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-success text-success-foreground';
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      case 'reagendamento':
        return 'bg-secondary-accent text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const loading = appointmentsLoading || clientsLoading || professionalsLoading || servicesLoading;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do seu salão de beleza
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Hoje
            </Button>
            <Button>
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-soft hover:shadow-elegant transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Agendamentos de Hoje
                    </CardTitle>
                    <CardDescription>
                      {nextAppointments.length} agendamentos programados
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nextAppointments.map((appointment) => (
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Cadastrar Cliente
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Scissors className="h-4 w-4 mr-2" />
                  Gerenciar Serviços
                </Button>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-warning-foreground">
                      2 confirmações pendentes
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agendamentos aguardando confirmação
                  </p>
                </div>
                
                <div className="p-3 bg-primary-soft/20 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      Meta mensal: 85%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você está no caminho certo!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;