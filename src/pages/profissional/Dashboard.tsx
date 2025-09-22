import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  User,
  Plus,
  Scissors,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  data_hora: string;
  cliente_nome: string;
  cliente_telefone: string;
  servico_nome: string;
  status: string;
  observacoes?: string;
}

interface DashboardStats {
  agendamentosHoje: number;
  agendamentosAmanha: number;
  clientesAtendidos: number;
  comissaoMes: number;
}

const ProfissionalDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    agendamentosHoje: 0,
    agendamentosAmanha: 0,
    clientesAtendidos: 0,
    comissaoMes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simular dados - aqui você implementaria as chamadas reais
      const mockAppointments: Appointment[] = [
        {
          id: "1",
          data_hora: new Date().toISOString(),
          cliente_nome: "Maria Silva",
          cliente_telefone: "(11) 99999-9999",
          servico_nome: "Corte e Escova",
          status: "confirmado",
          observacoes: "Cliente prefere corte mais curto"
        },
        {
          id: "2",
          data_hora: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          cliente_nome: "Ana Costa",
          cliente_telefone: "(11) 88888-8888",
          servico_nome: "Coloração",
          status: "confirmado"
        }
      ];

      setAppointments(mockAppointments);
      setStats({
        agendamentosHoje: 3,
        agendamentosAmanha: 2,
        clientesAtendidos: 15,
        comissaoMes: 1250.00
      });
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmado":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmado</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const todayAppointments = appointments.filter(apt => 
    isToday(new Date(apt.data_hora))
  );

  const tomorrowAppointments = appointments.filter(apt => 
    isTomorrow(new Date(apt.data_hora))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-pink-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Olá, {user?.user_metadata?.name || "Profissional"}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Aqui está um resumo da sua agenda e atividades
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.agendamentosHoje}</div>
            <p className="text-xs text-muted-foreground">
              {todayAppointments.length > 0 ? `${todayAppointments.length} confirmados` : "Nenhum agendamento"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Amanhã</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.agendamentosAmanha}</div>
            <p className="text-xs text-muted-foreground">
              {tomorrowAppointments.length > 0 ? `${tomorrowAppointments.length} programados` : "Nenhum agendamento"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.clientesAtendidos}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {stats.comissaoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Valor a receber</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Agendamentos de Hoje
            </CardTitle>
            <CardDescription>
              Seus compromissos para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{appointment.cliente_nome}</h4>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{appointment.servico_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appointment.data_hora), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
                <p className="text-sm text-muted-foreground">Aproveite para organizar sua agenda!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Próximos Agendamentos
            </CardTitle>
            <CardDescription>
              Seus compromissos futuros
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tomorrowAppointments.length > 0 ? (
              <div className="space-y-3">
                {tomorrowAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{appointment.cliente_nome}</h4>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{appointment.servico_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appointment.data_hora), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum agendamento futuro</p>
                <p className="text-sm text-muted-foreground">Verifique sua agenda para mais detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Novo Agendamento</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users className="h-6 w-6" />
              <span>Novo Cliente</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Scissors className="h-6 w-6" />
              <span>Gerenciar Serviços</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <DollarSign className="h-6 w-6" />
              <span>Ver Comissões</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfissionalDashboard;

