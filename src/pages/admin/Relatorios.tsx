import { BarChart3, DollarSign, TrendingUp, Calendar, Download, Filter, Users, Scissors, Clock, X, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useServices } from "@/hooks/useServices";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import * as XLSX from 'xlsx';

const Relatorios = () => {
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { clients, loading: clientsLoading } = useClients();
  const { professionals, loading: professionalsLoading } = useProfessionals();
  const { services, loading: servicesLoading } = useServices();

  // Estados para filtros
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loading = appointmentsLoading || clientsLoading || professionalsLoading || servicesLoading;

  // Função para filtrar agendamentos
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filtro por período
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(apt => {
        const aptDate = parseISO(apt.data_hora);
        return isWithinInterval(aptDate, { 
          start: startOfDay(dateRange.from!), 
          end: endOfDay(dateRange.to!) 
        });
      });
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filtro por profissional
    if (professionalFilter !== 'all') {
      filtered = filtered.filter(apt => apt.funcionario_id === professionalFilter);
    }

    // Filtro por serviço
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.servico_id === serviceFilter);
    }

    return filtered;
  }, [appointments, dateRange, statusFilter, professionalFilter, serviceFilter]);

  // Função para calcular dados do período filtrado
  const getFilteredData = () => {
    const completedAppointments = filteredAppointments.filter(apt => apt.status === 'concluido');
    const confirmedAppointments = filteredAppointments.filter(apt => apt.status === 'confirmado');
    const pendingAppointments = filteredAppointments.filter(apt => apt.status === 'pendente');
    const cancelledAppointments = filteredAppointments.filter(apt => apt.status === 'cancelado');

    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.servico_preco || 0), 0);
    const averageTicket = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

    return {
      total: filteredAppointments.length,
      completed: completedAppointments.length,
      confirmed: confirmedAppointments.length,
      pending: pendingAppointments.length,
      cancelled: cancelledAppointments.length,
      revenue: totalRevenue,
      averageTicket
    };
  };

  // Função para exportar dados
  const exportData = (format: 'xlsx' | 'pdf') => {
    const data = getFilteredData();
    const serviceRanking = getServiceRanking();
    const recentServices = getRecentServices();

    if (format === 'xlsx') {
      exportToXLSX(data, serviceRanking, recentServices);
    } else {
      exportToPDF(data, serviceRanking, recentServices);
    }
  };

  const exportToXLSX = (data: any, serviceRanking: any[], recentServices: any[]) => {
    // Criar workbook
    const workbook = XLSX.utils.book_new();
    
    // Dados do resumo
    const summaryData = [
      ['Relatório de Agendamentos'],
      [`Período: ${dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : ''} - ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : ''}`],
      [],
      ['Resumo'],
      ['Total de Agendamentos', data.total],
      ['Concluídos', data.completed],
      ['Confirmados', data.confirmed],
      ['Pendentes', data.pending],
      ['Cancelados', data.cancelled],
      ['Receita Total', `R$ ${data.revenue.toFixed(2)}`],
      ['Ticket Médio', `R$ ${data.averageTicket.toFixed(2)}`],
      []
    ];
    
    // Dados do ranking de serviços
    const rankingData = [
      ['Ranking de Serviços'],
      ['Posição', 'Serviço', 'Quantidade', 'Receita', 'Valor Médio']
    ];
    serviceRanking.forEach((service, index) => {
      rankingData.push([
        index + 1,
        service.name,
        service.quantity,
        `R$ ${service.revenue.toFixed(2)}`,
        `R$ ${(service.revenue / service.quantity).toFixed(2)}`
      ]);
    });
    
    // Dados dos serviços recentes
    const recentData = [
      ['Serviços Recentes'],
      ['Data', 'Cliente', 'Serviço', 'Profissional', 'Valor']
    ];
    recentServices.forEach(service => {
      recentData.push([
        service.date,
        service.client,
        service.service,
        service.professional,
        `R$ ${service.value.toFixed(2)}`
      ]);
    });
    
    // Criar planilha com todos os dados
    const allData = [
      ...summaryData,
      ...rankingData,
      [],
      ...recentData
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    
    // Aplicar estilos básicos
    worksheet['!cols'] = [
      { width: 20 }, // Coluna A
      { width: 25 }, // Coluna B
      { width: 15 }, // Coluna C
      { width: 20 }, // Coluna D
      { width: 20 }  // Coluna E
    ];
    
    // Adicionar planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    
    // Gerar e baixar arquivo
    const fileName = `relatorio_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = (data: any, serviceRanking: any[], recentServices: any[]) => {
    // Implementação básica - você pode usar uma biblioteca como jsPDF para uma implementação mais robusta
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório de Agendamentos</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h2 { color: #333; border-bottom: 2px solid #333; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
              .summary-item { padding: 10px; border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Relatório de Agendamentos</h1>
              <p>Período: ${dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : ''} - ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : ''}</p>
            </div>
            
            <div class="section">
              <h2>Resumo</h2>
              <div class="summary">
                <div class="summary-item">Total de Agendamentos: ${data.total}</div>
                <div class="summary-item">Concluídos: ${data.completed}</div>
                <div class="summary-item">Receita Total: R$ ${data.revenue.toFixed(2)}</div>
                <div class="summary-item">Ticket Médio: R$ ${data.averageTicket.toFixed(2)}</div>
              </div>
            </div>
            
            <div class="section">
              <h2>Ranking de Serviços</h2>
              <table>
                <tr><th>Posição</th><th>Serviço</th><th>Quantidade</th><th>Receita</th><th>Valor Médio</th></tr>
                ${serviceRanking.map((service, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${service.name}</td>
                    <td>${service.quantity}</td>
                    <td>R$ ${service.revenue.toFixed(2)}</td>
                    <td>R$ ${(service.revenue / service.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
            
            <div class="section">
              <h2>Serviços Recentes</h2>
              <table>
                <tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Valor</th></tr>
                ${recentServices.map(service => `
                  <tr>
                    <td>${service.date}</td>
                    <td>${service.client}</td>
                    <td>${service.service}</td>
                    <td>${service.professional}</td>
                    <td>R$ ${service.value.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    });
    setStatusFilter('all');
    setProfessionalFilter('all');
    setServiceFilter('all');
  };

  // Função para calcular dados do mês atual (para comparação)
  const getCurrentMonthData = () => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const currentMonthAppointments = appointments.filter(apt => {
      const aptDate = parseISO(apt.data_hora);
      return isWithinInterval(aptDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });
    });

    const completedAppointments = currentMonthAppointments.filter(apt => apt.status === 'concluido');
    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.servico_preco || 0), 0);

    return {
      total: currentMonthAppointments.length,
      completed: completedAppointments.length,
      revenue: totalRevenue
    };
  };

  // Calcular dados filtrados
  const filteredData = getFilteredData();
  const currentMonth = getCurrentMonthData();

  // Calcular crescimento vs mês atual
  const revenueGrowth = currentMonth.revenue > 0 
    ? ((filteredData.revenue - currentMonth.revenue) / currentMonth.revenue) * 100 
    : 0;

  // Ranking de serviços mais realizados (baseado nos filtros)
  const getServiceRanking = () => {
    const serviceStats: Record<string, { quantity: number; revenue: number; name: string }> = {};

    filteredAppointments.forEach(apt => {
      if (apt.status === 'concluido' && apt.servico_id) {
        const serviceName = apt.servico_nome || 'Serviço';
        if (!serviceStats[apt.servico_id]) {
          serviceStats[apt.servico_id] = {
            quantity: 0,
            revenue: 0,
            name: serviceName
          };
        }
        serviceStats[apt.servico_id].quantity += 1;
        serviceStats[apt.servico_id].revenue += apt.servico_preco || 0;
      }
    });

    return Object.values(serviceStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Serviços recentes (baseado nos filtros)
  const getRecentServices = () => {
    return filteredAppointments
      .filter(apt => apt.status === 'concluido')
      .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
      .slice(0, 10)
      .map(apt => ({
        date: format(parseISO(apt.data_hora), 'dd/MM/yyyy'),
        client: apt.cliente_nome || 'Cliente',
        service: apt.servico_nome || 'Serviço',
        professional: apt.funcionario_nome || 'Profissional',
        value: apt.servico_preco || 0
      }));
  };

  const serviceRanking = getServiceRanking();
  const recentServices = getRecentServices();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando relatórios...</p>
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
            <BarChart3 className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
              <p className="text-muted-foreground">
                Análises e estatísticas do seu salão
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {(statusFilter !== 'all' || professionalFilter !== 'all' || serviceFilter !== 'all') && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {(statusFilter !== 'all' ? 1 : 0) + (professionalFilter !== 'all' ? 1 : 0) + (serviceFilter !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filtros do Relatório</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Filtro por período */}
                  <div>
                    <label className="text-sm font-medium">Período</label>
                    <div className="flex gap-2 mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1 justify-start">
                            {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Data inicial'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1 justify-start">
                            {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Data final'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Filtro por status */}
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por profissional */}
                  <div>
                    <label className="text-sm font-medium">Profissional</label>
                    <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os profissionais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os profissionais</SelectItem>
                        {professionals.map(prof => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por serviço */}
                  <div>
                    <label className="text-sm font-medium">Serviço</label>
                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os serviços" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os serviços</SelectItem>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-4">
                    <Button onClick={clearFilters} variant="outline" className="flex-1">
                      Limpar Filtros
                    </Button>
                    <Button onClick={() => setShowFilters(false)} className="flex-1">
                      Aplicar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </PopoverTrigger>
                             <PopoverContent className="w-48">
                 <div className="space-y-2">
                   <Button 
                     variant="ghost" 
                     className="w-full justify-start"
                     onClick={() => exportData('xlsx')}
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Exportar XLSX
                   </Button>
                   <Button 
                     variant="ghost" 
                     className="w-full justify-start"
                     onClick={() => exportData('pdf')}
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Exportar PDF
                   </Button>
                 </div>
               </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita do Período
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {filteredData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className={`text-xs ${revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs mês atual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agendamentos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {filteredData.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredData.completed} concluídos • {filteredData.pending} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Médio
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {filteredData.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Por agendamento concluído
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conclusão
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {filteredData.total > 0 ? ((filteredData.completed / filteredData.total) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredData.completed} de {filteredData.total} agendamentos
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ranking de Serviços */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Ranking de Serviços
              </CardTitle>
              <CardDescription>
                Serviços mais realizados no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceRanking.length > 0 ? (
                  serviceRanking.map((service, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {service.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {service.quantity} realizados
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          R$ {service.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          R$ {(service.revenue / service.quantity).toFixed(2)} / serviço
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Scissors className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum serviço concluído no período</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Serviços Recentes */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Serviços Recentes
              </CardTitle>
              <CardDescription>
                Últimos 10 serviços concluídos no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentServices.length > 0 ? (
                  recentServices.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gradient-card rounded-lg border border-border">
                      <div className="text-sm text-muted-foreground min-w-[80px]">
                        {item.date}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {item.client}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.service} • {item.professional}
                        </div>
                      </div>
                      <div className="font-bold text-foreground">
                        R$ {item.value.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum serviço concluído no período</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Clientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {clients.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Clientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profissionais
              </CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {professionals.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Profissionais ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Serviços Disponíveis
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {services.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Serviços cadastrados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Relatorios;