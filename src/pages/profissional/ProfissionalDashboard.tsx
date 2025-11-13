import { Calendar, Users, Scissors, DollarSign, TrendingUp, Clock, Star, AlertCircle, Plus, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProfissionalLayout from "@/components/layout/ProfissionalLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { fixTimezone } from "@/utils/dateUtils";

const ProfissionalDashboard = () => {
  const { profile } = useAuth();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { clients, loading: clientsLoading } = useClients();
  const { services, loading: servicesLoading } = useServices();
  const navigate = useNavigate();

  // Filtrar apenas os agendamentos do profissional logado
  const myAppointments = appointments.filter(apt => apt.funcionario_id === profile?.id);
  const todayAppointments = myAppointments.filter(apt => isToday(fixTimezone(apt.data_hora)));
  const tomorrowAppointments = myAppointments.filter(apt => isTomorrow(fixTimezone(apt.data_hora)));
  
  // Calcular receita do mês atual
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const thisMonthRevenue = myAppointments
    .filter(apt => {
      const aptDate = fixTimezone(apt.data_hora);
      return apt.status === 'concluido' && 
             aptDate >= currentMonthStart && 
             aptDate <= currentMonthEnd &&
             apt.servico_preco;
    })
    .reduce((sum, apt) => sum + (apt.servico_preco || 0), 0);

  // Contar clientes únicos atendidos pelo profissional
  const uniqueClients = new Set(myAppointments.map(apt => apt.cliente_id || apt.cliente_nome)).size;

  const stats = [
    {
      title: "Agendamentos Hoje",
      value: todayAppointments.length.toString(),
      icon: Calendar,
      description: `${todayAppointments.filter(apt => apt.status === 'confirmado').length} confirmados`,
      trend: "up"
    },
    {
      title: "Agendamentos Amanhã",
      value: tomorrowAppointments.length.toString(),
      icon: Clock,
      description: "Próximos agendamentos",
      trend: "neutral"
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
      value: uniqueClients.toString(),
      icon: Users,
      description: "Clientes únicos atendidos",
      trend: "up"
    }
  ];

  const nextAppointments = myAppointments
    .filter(apt => (isToday(fixTimezone(apt.data_hora)) || isTomorrow(fixTimezone(apt.data_hora))) && apt.status !== 'cancelado')
    .slice(0, 5)
    .map(apt => ({
      id: apt.id,
      time: format(fixTimezone(apt.data_hora), 'HH:mm', { locale: ptBR }),
      client: apt.cliente_nome || 'Cliente',
      service: apt.servico_nome || 'Serviço',
      status: apt.status,
      duration: `${apt.servico_duracao || 60} min`
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
      case 'concluido':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
      case 'reagendamento':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800';
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Visão geral dos seus agendamentos e atividades
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/profissional/agenda')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Ver Agenda
            </Button>
            <Button onClick={() => navigate('/admin/agenda')}>
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
                <stat.icon className="h-4 w-4 text-primary" />
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
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/admin/agenda')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/admin/clientes')}
            >
              <Users className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/profissional/servicos')}
            >
              <Scissors className="h-4 w-4 mr-2" />
              Gerenciar Serviços
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/profissional/clientes')}
            >
              <Users className="h-4 w-4 mr-2" />
              Meus Clientes
            </Button>
          </CardContent>
        </Card>

        {/* Próximos Agendamentos */}
        {nextAppointments.length > 0 && (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nextAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{apt.client}</p>
                        <p className="text-sm text-muted-foreground">{apt.service} • {apt.duration}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{apt.time}</p>
                      <Badge className={getStatusColor(apt.status)}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/profissional/agenda')}
                >
                  Ver Agenda Completa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.filter(apt => apt.status === 'pendente').length > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-warning-foreground">
                    {todayAppointments.filter(apt => apt.status === 'pendente').length} confirmações pendentes
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Agendamentos aguardando confirmação
                </p>
              </div>
            )}
            {tomorrowAppointments.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {tomorrowAppointments.length} agendamentos amanhã
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Prepare-se para o próximo dia
                </p>
              </div>
            )}
            {thisMonthRevenue > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    R$ {thisMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} este mês
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Receita dos serviços concluídos
                </p>
              </div>
            )}
            {myAppointments.length === 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    Nenhum agendamento encontrado
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comece criando seu primeiro agendamento
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProfissionalLayout>
  );
};

export default ProfissionalDashboard; 