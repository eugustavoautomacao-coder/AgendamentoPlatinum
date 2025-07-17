import { Calendar, Users, Scissors, DollarSign, TrendingUp, Clock, Star, AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProfissionalLayout from "@/components/layout/ProfissionalLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ProfissionalDashboard = () => {
  const { profile } = useAuth();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { clients, loading: clientsLoading } = useClients();
  const { services, loading: servicesLoading } = useServices();

  // Filtrar apenas os agendamentos do profissional logado
  const myAppointments = appointments.filter(apt => apt.professional_id === profile?.id);
  const todayAppointments = myAppointments.filter(apt => isToday(new Date(apt.start_time)));
  const thisMonthRevenue = myAppointments
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
      title: "Meus Clientes",
      value: clients.filter(c => c.professional_id === profile?.id).length.toString(),
      icon: Users,
      description: "Total atendidos",
      trend: "up"
    },
    {
      title: "Serviços",
      value: services.length.toString(),
      icon: Scissors,
      description: "Tipos de serviço",
      trend: "neutral"
    }
  ];

  const nextAppointments = myAppointments
    .filter(apt => (isToday(new Date(apt.start_time)) || isTomorrow(new Date(apt.start_time))) && apt.status !== 'cancelado')
    .slice(0, 5)
    .map(apt => ({
      id: apt.id,
      time: format(new Date(apt.start_time), 'HH:mm', { locale: ptBR }),
      client: apt.client_name || 'Cliente',
      service: apt.service_name || 'Serviço',
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

  const loading = appointmentsLoading || clientsLoading || servicesLoading;

  if (loading) {
    return (
      <ProfissionalLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </ProfissionalLayout>
    );
  }

  return (
    <ProfissionalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu trabalho</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Hoje
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
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
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
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
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Novo Cliente
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
                  {todayAppointments.filter(apt => apt.status === 'pendente').length} confirmações pendentes
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
    </ProfissionalLayout>
  );
};

export default ProfissionalDashboard; 