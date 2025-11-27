import { Calendar, Users, Scissors, DollarSign, TrendingUp, Clock, Star, AlertCircle, Plus, LayoutDashboard, CalendarIcon, UserIcon, Phone, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useServices } from "@/hooks/useServices";
import { useAppointmentRequests } from "@/hooks/useAppointmentRequests";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fixTimezone } from "@/utils/dateUtils";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { clients, loading: clientsLoading } = useClients();
  const { professionals, loading: professionalsLoading } = useProfessionals();
  const { services, loading: servicesLoading } = useServices();
  const { fetchAppointmentRequests } = useAppointmentRequests();
  
  // Estado para data selecionada
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  
  // Verificar se a data selecionada é hoje (ou se não há data selecionada, considera hoje)
  const isSelectedDateToday = !selectedDate || (selectedDate && isToday(selectedDate));

  // Calculate stats from real data
  const appointmentsArray = Array.isArray(appointments) ? appointments : [];
  
  // Filtrar agendamentos pela data selecionada (se não há data, usa hoje)
  const selectedDateAppointments = selectedDate 
    ? appointmentsArray.filter(apt => 
        isSameDay(fixTimezone(apt.data_hora), selectedDate)
      )
    : appointmentsArray.filter(apt => 
        isToday(fixTimezone(apt.data_hora))
      );
  
  const todayAppointments = appointmentsArray.filter(apt => 
    isToday(fixTimezone(apt.data_hora))
  );
  
  // Calcular receita do mês
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  
  const thisMonthRevenue = appointmentsArray
    .filter(apt => {
      const aptDate = fixTimezone(apt.data_hora);
      return apt.status === 'concluido' && 
             aptDate >= currentMonthStart && 
             aptDate <= currentMonthEnd &&
             apt.servico_preco;
    })
    .reduce((sum, apt) => sum + (apt.servico_preco || 0), 0);
  
  // Buscar solicitações de agendamento pendentes
  useEffect(() => {
    const loadPendingRequests = async () => {
      if (!profile?.salao_id) {
        setPendingRequests(0);
        return;
      }
      
      try {
        const requests = await fetchAppointmentRequests(profile.salao_id);
        const pendingCount = requests.filter(r => r.status === 'pendente').length;
        setPendingRequests(pendingCount);
      } catch (error) {
        console.error('Erro ao buscar solicitações pendentes:', error);
        setPendingRequests(0);
      }
    };
    
    loadPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.salao_id]);
  
  // Agendamentos pendentes de hoje (status 'pendente')
  const todayPendingAppointments = todayAppointments.filter(apt => apt.status === 'pendente').length;
  
  // Agendamentos de amanhã
  const tomorrowAppointments = appointmentsArray.filter(apt => 
    isTomorrow(fixTimezone(apt.data_hora)) && apt.status !== 'cancelado'
  );

  const stats = [
    {
      title: selectedDate ? `Agendamentos ${format(selectedDate, 'dd/MM', { locale: ptBR })}` : "Agendamentos Hoje",
      value: selectedDateAppointments.length.toString(),
      icon: Calendar,
      description: isSelectedDateToday 
        ? "Hoje" 
        : `${selectedDateAppointments.filter(apt => apt.status === 'confirmado').length} confirmados`,
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

  // Get appointments for selected date
  const nextAppointments = selectedDateAppointments
    .filter(apt => apt.status !== 'cancelado')
    .slice(0, 5)
    .map(apt => ({
      id: apt.id,
      time: format(fixTimezone(apt.data_hora), 'HH:mm', { locale: ptBR }),
      client: apt.cliente_nome || 'Cliente',
      service: apt.servico_nome || 'Serviço',
      professional: apt.funcionario_nome || 'Profissional',
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

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Visão geral do seu salão de beleza
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {isSelectedDateToday ? 'Hoje' : (selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Hoje')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={() => navigate('/admin/agenda?modal=new')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-l-4 border-l-primary shadow-soft hover:shadow-elegant transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
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
              <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap text-base sm:text-lg">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">
                        {selectedDate ? `Agendamentos ${format(selectedDate, 'dd/MM', { locale: ptBR })}` : 'Agendamentos de Hoje'}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs sm:text-sm">
                      {nextAppointments.length} {nextAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/agenda')}
                    className="flex-shrink-0 self-start text-xs sm:text-sm px-2 sm:px-3 h-8"
                  >
                    <span className="hidden sm:inline">Ver Todos</span>
                    <span className="sm:hidden">Ver</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-3">
                  {nextAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft hover:scale-[1.01] sm:hover:scale-[1.02] hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/admin/agenda?appointment=${appointment.id}`)}
                    >
                      {/* Mobile: Header com horário e status */}
                      <div className="flex items-center justify-between sm:hidden">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">{appointment.time}</span>
                          <span className="text-xs text-muted-foreground">({appointment.duration})</span>
                        </div>
                        <Badge className={getStatusColor(appointment.status) + ' text-xs'}>
                          {capitalizeFirstLetter(appointment.status)}
                        </Badge>
                      </div>
                      
                      {/* Mobile: Conteúdo */}
                      <div className="flex flex-col gap-1 sm:hidden">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <UserIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="text-sm truncate">{appointment.client}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Scissors className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{appointment.service} • {appointment.professional}</span>
                        </div>
                      </div>

                      {/* Desktop: Layout original */}
                      <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-center flex-shrink-0">
                          <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            {appointment.time}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {appointment.duration}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 font-medium text-foreground truncate">
                            <UserIcon className="h-4 w-4 text-primary flex-shrink-0" />
                            {appointment.client}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <Scissors className="h-3 w-3 flex-shrink-0" />
                            {appointment.service} • {appointment.professional}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status) + ' flex-shrink-0 hidden sm:inline-flex'}>
                        {capitalizeFirstLetter(appointment.status)}
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
                <Button 
                  className="w-full justify-start hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200" 
                  variant="outline"
                  onClick={() => navigate('/admin/agenda?modal=new')}
                >
                  <Plus className="h-4 w-4 mr-2 text-primary" />
                  Novo Agendamento
                </Button>
                <Button 
                  className="w-full justify-start hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200" 
                  variant="outline"
                  onClick={() => navigate('/admin/clientes?modal=new')}
                >
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Cadastrar Cliente
                </Button>
                <Button 
                  className="w-full justify-start hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200" 
                  variant="outline"
                  onClick={() => navigate('/admin/servicos')}
                >
                  <Scissors className="h-4 w-4 mr-2 text-primary" />
                  Gerenciar Serviços
                </Button>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests > 0 && (
                  <div 
                    className="p-3 bg-warning/10 border border-warning/20 rounded-lg cursor-pointer hover:bg-warning/15 transition-colors"
                    onClick={() => navigate('/admin/solicitacoes-agendamento?filter=pendente')}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning-foreground" />
                      <span className="text-sm font-medium text-warning-foreground">
                        {pendingRequests} {pendingRequests === 1 ? 'confirmação pendente' : 'confirmações pendentes'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solicitações de agendamento aguardando confirmação
                    </p>
                  </div>
                )}
                
                {todayPendingAppointments > 0 && (
                  <div 
                    className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                    onClick={() => navigate('/admin/agenda?filter=pendente')}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        {todayPendingAppointments} {todayPendingAppointments === 1 ? 'agendamento pendente hoje' : 'agendamentos pendentes hoje'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Agendamentos de hoje aguardando confirmação
                    </p>
                  </div>
                )}
                
                {tomorrowAppointments.length > 0 && (
                  <div 
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    onClick={() => navigate('/admin/agenda')}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {tomorrowAppointments.length} {tomorrowAppointments.length === 1 ? 'agendamento amanhã' : 'agendamentos amanhã'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prepare-se para o próximo dia
                    </p>
                  </div>
                )}
                
                {pendingRequests === 0 && todayPendingAppointments === 0 && tomorrowAppointments.length === 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Tudo em dia!
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nenhuma ação pendente no momento
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;