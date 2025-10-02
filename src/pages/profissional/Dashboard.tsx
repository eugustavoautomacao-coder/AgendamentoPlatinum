import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  LayoutDashboard,
  UserIcon,
  Phone,
  Calendar as CalendarIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { format, isToday, isTomorrow, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { fixTimezone } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";

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
  const { profile } = useAuth();
  const { appointments: allAppointments, loading: appointmentsLoading } = useAppointments();
  const { clients, loading: clientsLoading, createClient } = useClients();
  const { services, createService } = useServices();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Estados para modais
  const [agendamentoModalOpen, setAgendamentoModalOpen] = useState(false);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [servicoModalOpen, setServicoModalOpen] = useState(false);
  const [detalhesAgendamentoOpen, setDetalhesAgendamentoOpen] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Appointment | null>(null);
  
  // Estados para formulários
  const [agendamentoForm, setAgendamentoForm] = useState({
    cliente_id: '',
    servico_id: '',
    date: '',
    time: ''
  });
  
  const [clienteForm, setClienteForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    observacoes: ''
  });
  
  const [servicoForm, setServicoForm] = useState({
    nome: '',
    duracao_minutos: 60,
    preco: 0,
    categoria: '',
    descricao: ''
  });
  
  const [saving, setSaving] = useState(false);

  // Filtrar apenas os agendamentos do profissional logado
  const myAppointments = allAppointments.filter(apt => apt.funcionario_id === profile?.id);
  
  // Calcular estatísticas com dados reais
  const todayAppointments = myAppointments.filter(apt => isToday(fixTimezone(apt.data_hora)));
  const tomorrowAppointments = myAppointments.filter(apt => isTomorrow(fixTimezone(apt.data_hora)));
  
  // Calcular comissão do mês atual
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

  // Calcular comissão baseada no percentual do profissional
  const thisMonthCommission = thisMonthRevenue * ((profile?.percentual_comissao || 0) / 100);

  // Contar clientes únicos atendidos pelo profissional
  const uniqueClients = new Set(myAppointments.map(apt => apt.cliente_id || apt.cliente_nome)).size;

  // Estatísticas calculadas com dados reais
  const stats: DashboardStats = {
    agendamentosHoje: todayAppointments.length,
    agendamentosAmanha: tomorrowAppointments.length,
    clientesAtendidos: uniqueClients,
    comissaoMes: thisMonthCommission
  };

  // Converter agendamentos para o formato esperado pelo layout
  const appointments: Appointment[] = myAppointments.map(apt => ({
    id: apt.id,
    data_hora: apt.data_hora,
    cliente_nome: apt.cliente_nome || 'Cliente',
    cliente_telefone: apt.cliente_telefone || '',
    servico_nome: apt.servico_nome || 'Serviço',
    status: apt.status,
    observacoes: apt.observacoes
  }));

  useEffect(() => {
    // Simular loading inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [appointmentsLoading, clientsLoading]);

  // Funções para ações rápidas
  const handleNovoAgendamento = () => {
    setAgendamentoForm({
      cliente_id: '',
      servico_id: '',
      date: '',
      time: ''
    });
    setAgendamentoModalOpen(true);
  };

  const handleVerDetalhesAgendamento = (appointment: Appointment) => {
    setAgendamentoSelecionado(appointment);
    setDetalhesAgendamentoOpen(true);
  };

  // Função para extrair apenas o primeiro nome
  const getFirstName = (fullName: string) => {
    return fullName?.split(' ')[0] || fullName;
  };

  const handleNovoCliente = () => {
    setClienteForm({
      nome: '',
      email: '',
      telefone: '',
      observacoes: ''
    });
    setClienteModalOpen(true);
  };

  const handleGerenciarServicos = () => {
    setServicoForm({
      nome: '',
      duracao_minutos: 60,
      preco: 0,
      categoria: '',
      descricao: ''
    });
    setServicoModalOpen(true);
  };

  const handleVerComissoes = () => {
    navigate('/profissional/comissoes');
  };
  
  // Funções para salvar
  const handleSaveCliente = async () => {
    if (!clienteForm.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      await createClient({
        nome: clienteForm.nome,
        email: clienteForm.email || undefined,
        telefone: clienteForm.telefone || undefined,
        observacoes: clienteForm.observacoes || undefined
      });
      
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!"
      });
      
      setClienteModalOpen(false);
      setClienteForm({
        nome: '',
        email: '',
        telefone: '',
        observacoes: ''
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar cliente",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveServico = async () => {
    if (!servicoForm.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      await createService({
        nome: servicoForm.nome,
        duracao_minutos: servicoForm.duracao_minutos,
        preco: servicoForm.preco,
        categoria: servicoForm.categoria || undefined,
        descricao: servicoForm.descricao || undefined
      });
      
      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso!"
      });
      
      setServicoModalOpen(false);
      setServicoForm({
        nome: '',
        duracao_minutos: 60,
        preco: 0,
        categoria: '',
        descricao: ''
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar serviço",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
      case "concluido":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    }
  };

  // Usar os agendamentos já filtrados acima
  const todayAppointmentsFiltered = appointments.filter(apt => 
    isToday(fixTimezone(apt.data_hora))
  );

  const tomorrowAppointmentsFiltered = appointments.filter(apt => 
    isTomorrow(fixTimezone(apt.data_hora))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              Olá, {getFirstName(profile?.nome || "Profissional")}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Aqui está um resumo da sua agenda e atividades
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.agendamentosHoje}</div>
            <p className="text-xs text-muted-foreground">
              {todayAppointmentsFiltered.length > 0 ? `${todayAppointmentsFiltered.length} confirmados` : "Nenhum agendamento"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Amanhã</CardTitle>
            <Clock className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.agendamentosAmanha}</div>
            <p className="text-xs text-muted-foreground">
              {tomorrowAppointmentsFiltered.length > 0 ? `${tomorrowAppointmentsFiltered.length} programados` : "Nenhum agendamento"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.clientesAtendidos}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
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
            {todayAppointmentsFiltered.length > 0 ? (
              <div className="space-y-4">
                {todayAppointmentsFiltered.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg border border-border hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                    onClick={() => handleVerDetalhesAgendamento(appointment)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Coluna esquerda */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                            {format(fixTimezone(appointment.data_hora), "HH:mm", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                            {format(fixTimezone(appointment.data_hora), "dd/MM", { locale: ptBR })}
                          </div>
                        </div>
                        
                        {/* Coluna direita */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-medium text-foreground truncate">
                            <UserIcon className="h-4 w-4 text-primary flex-shrink-0" />
                            {appointment.cliente_nome}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <Scissors className="h-3 w-3 flex-shrink-0" />
                            {appointment.servico_nome}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(appointment.status)}
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
            {tomorrowAppointmentsFiltered.length > 0 ? (
              <div className="space-y-4">
                {tomorrowAppointmentsFiltered.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg border border-border hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                    onClick={() => handleVerDetalhesAgendamento(appointment)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Coluna esquerda */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                            {format(fixTimezone(appointment.data_hora), "HH:mm", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                            {format(fixTimezone(appointment.data_hora), "dd/MM", { locale: ptBR })}
                          </div>
                        </div>
                        
                        {/* Coluna direita */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-medium text-foreground truncate">
                            <UserIcon className="h-4 w-4 text-primary flex-shrink-0" />
                            {appointment.cliente_nome}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <Scissors className="h-3 w-3 flex-shrink-0" />
                            {appointment.servico_nome}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(appointment.status)}
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
        <CardContent className="space-y-3">
          <Button 
            className="w-full justify-start hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200" 
            variant="outline"
            onClick={handleNovoAgendamento}
          >
            <Plus className="h-4 w-4 mr-2 text-primary" />
            Novo Agendamento
          </Button>
          <Button 
            className="w-full justify-start hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200" 
            variant="outline"
            onClick={handleNovoCliente}
          >
            <Users className="h-4 w-4 mr-2 text-primary" />
            Novo Cliente
          </Button>
          <Button 
            className="w-full justify-start hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200" 
            variant="outline"
            onClick={handleGerenciarServicos}
          >
            <Scissors className="h-4 w-4 mr-2 text-primary" />
            Gerenciar Serviços
          </Button>
          <Button 
            className="w-full justify-start hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200" 
            variant="outline"
            onClick={handleVerComissoes}
          >
            <DollarSign className="h-4 w-4 mr-2 text-primary" />
            Ver Comissões
          </Button>
        </CardContent>
      </Card>
      
      {/* Modal de Novo Cliente */}
      <Dialog open={clienteModalOpen} onOpenChange={setClienteModalOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto sm:w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[85vh] overflow-y-auto my-4 modal-scrollbar">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Novo Cliente
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Preencha os dados para cadastrar um novo cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 sm:space-y-3 md:space-y-4 py-1 sm:py-2">
            {/* Nome - Campo obrigatório */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium sm:text-base">
                Nome *
              </Label>
              <Input
                id="nome"
                value={clienteForm.nome}
                onChange={(e) => setClienteForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo do cliente"
                className="w-full h-8 sm:h-9 md:h-10 text-sm"
                required
              />
            </div>
            
            {/* Email e Telefone em grid responsivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="email" className="text-sm font-medium sm:text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={clienteForm.email}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full h-8 sm:h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="telefone" className="text-sm font-medium sm:text-base">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={clienteForm.telefone}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="w-full h-8 sm:h-9 md:h-10 text-sm"
                />
              </div>
            </div>
            
            {/* Observações */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="observacoes" className="text-sm font-medium sm:text-base">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={clienteForm.observacoes}
                onChange={(e) => setClienteForm(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o cliente"
                rows={2}
                className="w-full text-sm resize-none min-h-[50px] sm:min-h-[60px]"
              />
            </div>
          </div>
          
          {/* Botões responsivos */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 sm:pt-3">
            <Button 
              variant="outline" 
              onClick={() => setClienteModalOpen(false)}
              className="w-full sm:w-auto h-8 sm:h-9 text-sm order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCliente} 
              disabled={saving}
              className="w-full sm:w-auto h-8 sm:h-9 text-sm order-1 sm:order-2"
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Novo Serviço */}
      <Dialog open={servicoModalOpen} onOpenChange={setServicoModalOpen}>
        <DialogContent className="sm:max-w-md modal-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Novo Serviço
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo serviço.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="servico-nome">Nome *</Label>
              <Input
                id="servico-nome"
                value={servicoForm.nome}
                onChange={(e) => setServicoForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do serviço"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração (min)</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={servicoForm.duracao_minutos}
                  onChange={(e) => setServicoForm(prev => ({ ...prev, duracao_minutos: parseInt(e.target.value) || 60 }))}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={servicoForm.preco}
                  onChange={(e) => setServicoForm(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={servicoForm.categoria}
                onChange={(e) => setServicoForm(prev => ({ ...prev, categoria: e.target.value }))}
                placeholder="Ex: Corte, Coloração, Manicure"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={servicoForm.descricao}
                onChange={(e) => setServicoForm(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do serviço"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setServicoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveServico} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Novo Agendamento */}
      <Dialog open={agendamentoModalOpen} onOpenChange={setAgendamentoModalOpen}>
        <DialogContent className="sm:max-w-md modal-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Novo Agendamento
            </DialogTitle>
            <DialogDescription>
              Crie um novo agendamento para seu cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={agendamentoForm.cliente_id}
                onChange={(e) => setAgendamentoForm(prev => ({ ...prev, cliente_id: e.target.value }))}
                required
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Serviço *</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={agendamentoForm.servico_id}
                onChange={(e) => setAgendamentoForm(prev => ({ ...prev, servico_id: e.target.value }))}
                required
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nome} - R$ {service.preco}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={agendamentoForm.date}
                  onChange={(e) => setAgendamentoForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Horário *</Label>
                <Input
                  id="time"
                  type="time"
                  value={agendamentoForm.time}
                  onChange={(e) => setAgendamentoForm(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAgendamentoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast({
                title: "Info",
                description: "Para criar agendamentos, acesse a página de Agenda"
              });
              setAgendamentoModalOpen(false);
              navigate('/profissional/agenda');
            }}>
              Ir para Agenda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Agendamento */}
      <Dialog open={detalhesAgendamentoOpen} onOpenChange={setDetalhesAgendamentoOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Calendar className="h-6 w-6 text-primary" />
              Detalhes do Agendamento
            </DialogTitle>
            <DialogDescription className="text-base">
              Informações completas do agendamento
            </DialogDescription>
          </DialogHeader>
          
          {agendamentoSelecionado && (
            <div className="space-y-6">
              {/* Data/Hora e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Data e Hora
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-base">
                      {format(fixTimezone(agendamentoSelecionado.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </Label>
                  <div className="flex items-center">
                    <Badge 
                      variant={agendamentoSelecionado.status === 'concluido' ? 'default' : 
                              agendamentoSelecionado.status === 'confirmado' ? 'secondary' : 'outline'}
                      className="capitalize text-sm px-4 py-2"
                    >
                      {agendamentoSelecionado.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Cliente
                </Label>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-lg">{agendamentoSelecionado.cliente_nome}</span>
                  </div>
                  {agendamentoSelecionado.cliente_telefone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-base text-muted-foreground">
                        {agendamentoSelecionado.cliente_telefone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Serviço */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Serviço
                </Label>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Scissors className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-semibold text-base">{agendamentoSelecionado.servico_nome}</span>
                </div>
              </div>

              {/* Observações */}
              {agendamentoSelecionado.observacoes && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Observações
                  </Label>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {agendamentoSelecionado.observacoes}
                    </p>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profissional/agenda')}
                  className="flex-1 h-12 text-base"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Ver na Agenda
                </Button>
                <Button 
                  onClick={() => setDetalhesAgendamentoOpen(false)}
                  className="flex-1 h-12 text-base"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfissionalDashboard;

















