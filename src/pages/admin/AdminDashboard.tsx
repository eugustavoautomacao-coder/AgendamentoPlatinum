import { Calendar, Users, Scissors, DollarSign, TrendingUp, Clock, Star, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";

const AdminDashboard = () => {
  // Mock data - será substituído por dados reais da API
  const stats = [
    {
      title: "Agendamentos Hoje",
      value: "12",
      icon: Calendar,
      description: "+2 desde ontem",
      trend: "up"
    },
    {
      title: "Receita do Mês",
      value: "R$ 8.450",
      icon: DollarSign,
      description: "+15% vs mês anterior",
      trend: "up"
    },
    {
      title: "Clientes Ativos",
      value: "186",
      icon: Users,
      description: "+12 novos este mês",
      trend: "up"
    },
    {
      title: "Taxa de Ocupação",
      value: "87%",
      icon: TrendingUp,
      description: "Média dos últimos 7 dias",
      trend: "neutral"
    }
  ];

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
      time: "11:15",
      client: "Fernanda Oliveira",
      service: "Manicure",
      professional: "Lucia Santos",
      status: "confirmado",
      duration: "60 min"
    },
    {
      id: 4,
      time: "14:00",
      client: "Rafael Costa",
      service: "Corte Masculino",
      professional: "Ana Costa",
      status: "reagendamento",
      duration: "45 min"
    }
  ];

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
                      {todayAppointments.length} agendamentos programados
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Todos
                  </Button>
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