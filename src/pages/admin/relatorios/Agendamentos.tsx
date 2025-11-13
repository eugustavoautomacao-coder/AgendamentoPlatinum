import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Download, 
  Filter, 
  ArrowLeft,
  BarChart3,
  PieChart,
  Clock,
  Users,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay, getDay, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToExcel, exportToPDF, formatCurrency, formatPercentage, formatDate } from '@/utils/exportUtils';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';

const RelatorioAgendamentos = () => {
  const navigate = useNavigate();
  const { appointments, loading } = useAppointments();

  // Estados para filtros
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dados filtrados
  const filteredData = useMemo(() => {
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

    return filtered;
  }, [appointments, dateRange, statusFilter]);

  // Cálculos do relatório
  const reportData = useMemo(() => {
    const totalAppointments = filteredData.length;
    
    // Agrupamento por status
    const statusDistribution = filteredData.reduce((acc, apt) => {
      const status = apt.status || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupamento por mês
    const monthlyAppointments = filteredData.reduce((acc, apt) => {
      const month = format(parseISO(apt.data_hora), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupamento por dia da semana
    const weeklyDistribution = filteredData.reduce((acc, apt) => {
      const dayOfWeek = getDay(parseISO(apt.data_hora));
      const dayName = format(parseISO(apt.data_hora), 'EEEE', { locale: ptBR });
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupamento por horário
    const hourlyDistribution = filteredData.reduce((acc, apt) => {
      const hour = getHours(parseISO(apt.data_hora));
      const hourRange = `${hour.toString().padStart(2, '0')}:00`;
      acc[hourRange] = (acc[hourRange] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Taxa de ocupação (estimativa baseada em 8h de trabalho por dia)
    const workingHoursPerDay = 8;
    const totalDays = dateRange.from && dateRange.to 
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 30;
    const totalWorkingHours = totalDays * workingHoursPerDay;
    const totalAppointmentHours = filteredData.reduce((sum, apt) => sum + (apt.servico_duracao || 60), 0) / 60;
    const occupancyRate = totalWorkingHours > 0 ? (totalAppointmentHours / totalWorkingHours) * 100 : 0;

    // Agrupamento por profissional
    const professionalDistribution = filteredData.reduce((acc, apt) => {
      const professionalName = apt.funcionario_nome || 'Profissional não identificado';
      acc[professionalName] = (acc[professionalName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular contadores por status
    const confirmedCount = statusDistribution.confirmado || 0;
    const pendingCount = statusDistribution.pendente || 0;
    const cancelledCount = statusDistribution.cancelado || 0;
    const completedCount = statusDistribution.concluido || 0;
    const confirmationRate = totalAppointments > 0 ? (confirmedCount / totalAppointments) * 100 : 0;

    return {
      totalAppointments,
      statusDistribution,
      monthlyAppointments,
      weeklyDistribution,
      hourlyDistribution,
      occupancyRate,
      professionalDistribution,
      confirmedCount,
      pendingCount,
      cancelledCount,
      completedCount,
      confirmationRate
    };
  }, [filteredData, dateRange]);

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    // Dados para gráfico de linha (agendamentos mensais)
    const monthlyChartData = Object.entries(reportData.monthlyAppointments)
      .map(([month, count]) => ({
        month: format(new Date(month + '-01'), 'MMM/yy'),
        appointments: count,
        fullMonth: month
      }))
      .sort((a, b) => new Date(a.fullMonth + '-01').getTime() - new Date(b.fullMonth + '-01').getTime());

    // Dados para gráfico de pizza (distribuição por status)
    const pieChartData = Object.entries(reportData.statusDistribution)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count
      }))
      .sort((a, b) => b.value - a.value);

    // Dados para gráfico de barras (distribuição semanal)
    const weeklyChartData = Object.entries(reportData.weeklyDistribution)
      .map(([day, count]) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        appointments: count
      }))
      .sort((a, b) => {
        const daysOrder = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
        return daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
      });

    // Dados para gráfico de barras (distribuição por profissional)
    const professionalChartData = Object.entries(reportData.professionalDistribution)
      .map(([professional, count]) => ({
        name: professional,
        appointments: count
      }))
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 10); // Top 10 profissionais

    return {
      monthly: monthlyChartData,
      pie: pieChartData,
      weekly: weeklyChartData,
      professional: professionalChartData
    };
  }, [reportData]);

  // Cores para gráficos
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', 
    '#8dd1e1', '#d084d0', '#ff6b6b', '#4ecdc4'
  ];

  // Custom tooltip para gráfico de linha
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Mês: ${label}`}</p>
          <p className="text-indigo-600 font-semibold">
            {`Agendamentos: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip para gráfico de pizza
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-indigo-600 font-semibold">
            {`${payload[0].value} agendamentos`}
          </p>
          <p className="text-gray-500 text-sm">
            {`${((payload[0].value / reportData.totalAppointments) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Exportar para Excel
  const handleExportExcel = () => {
    const data = [
      ['Relatório de Agendamentos'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      [''],
      ['RESUMO'],
      ['Total de Agendamentos:', (reportData.totalAppointments || 0).toString()],
      ['Taxa de Ocupação:', formatPercentage(reportData.occupancyRate || 0)],
      ['Confirmados:', (reportData.confirmedCount || 0).toString()],
      ['Pendentes:', (reportData.pendingCount || 0).toString()],
      [''],
      ['DETALHAMENTO DE AGENDAMENTOS'],
      ['Data', 'Hora', 'Serviço', 'Profissional', 'Cliente', 'Status', 'Duração (min)', 'Valor'],
      ...filteredData.map(apt => [
        formatDate(apt.data_hora),
        format(parseISO(apt.data_hora), 'HH:mm'),
        apt.servico_nome || 'N/A',
        apt.funcionario_nome || 'N/A',
        apt.cliente_nome || 'N/A',
        apt.status || 'N/A',
        apt.servico_duracao || 'N/A',
        formatCurrency(apt.servico_preco || 0)
      ]),
      [''],
      ['DISTRIBUIÇÃO POR STATUS'],
      ['Status', 'Quantidade', 'Percentual'],
      ...Object.entries(reportData.statusDistribution).map(([status, count]) => [
        status.charAt(0).toUpperCase() + status.slice(1),
        (count || 0).toString(),
        formatPercentage((count / (reportData.totalAppointments || 1)) * 100)
      ]),
      [''],
      ['DISTRIBUIÇÃO SEMANAL'],
      ['Dia da Semana', 'Agendamentos'],
      ...(chartData.weekly || []).map(item => [
        item.day,
        (item.appointments || 0).toString()
      ]),
      [''],
      ['TOP PROFISSIONAIS'],
      ['Profissional', 'Agendamentos'],
      ...(chartData.topProfessionals || []).map(item => [
        item.name,
        (item.appointments || 0).toString()
      ])
    ];

    const result = exportToExcel(data, 'relatorio-agendamentos', 'Agendamentos');
    if (result.success) {
      console.log(result.message);
    }
  };

  // Exportar para PDF
  const handleExportPDF = () => {
    const data = [
      ['RESUMO EXECUTIVO'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      ['Total de Agendamentos:', (reportData.totalAppointments || 0).toString()],
      ['Taxa de Ocupação:', formatPercentage(reportData.occupancyRate || 0)],
      ['Confirmados:', (reportData.confirmedCount || 0).toString()],
      ['Pendentes:', (reportData.pendingCount || 0).toString()],
      ['Cancelados:', (reportData.cancelledCount || 0).toString()],
      ['Concluídos:', (reportData.completedCount || 0).toString()],
      [''],
      ['DISTRIBUIÇÃO POR STATUS'],
      ['Status', 'Quantidade', 'Percentual'],
      ...(chartData.pie || []).map(item => [
        item.name,
        (item.value || 0).toString(),
        formatPercentage(((item.value || 0) / (reportData.totalAppointments || 1)) * 100)
      ]),
      [''],
      ['EVOLUÇÃO MENSAL'],
      ['Mês', 'Agendamentos', 'Confirmados'],
      ...(chartData.monthly || []).map(item => [
        item.month,
        (item.appointments || 0).toString(),
        (item.confirmed || 0).toString()
      ])
    ];

    exportToPDF(data, 'relatorio-agendamentos', 'Relatório de Agendamentos');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/admin/relatorios')}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Relatório de Agendamentos</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Análise de ocupação e distribuição da agenda
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="quarter">Este Trimestre</SelectItem>
                    <SelectItem value="year">Este Ano</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.occupancyRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Horários ocupados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportData.statusDistribution.confirmado || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Agendamentos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {reportData.statusDistribution.pendente || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando confirmação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Agendamentos Mensais */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#888888" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Nenhum dado disponível para o período selecionado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Distribuição por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.pie.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.pie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.pie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Nenhum dado disponível para o período selecionado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Distribuição Semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Agendamentos por Dia da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.weekly.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#888888" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Agendamentos']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar 
                    dataKey="appointments" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Top Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Profissionais por Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.professional.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData.professional}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Agendamentos']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar 
                    dataKey="appointments" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Dados */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Hora</th>
                    <th className="text-left p-2">Serviço</th>
                    <th className="text-left p-2">Profissional</th>
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
                    .map((apt, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {format(parseISO(apt.data_hora), 'dd/MM/yyyy')}
                      </td>
                      <td className="p-2">
                        {format(parseISO(apt.data_hora), 'HH:mm')}
                      </td>
                      <td className="p-2">{apt.servico_nome || 'N/A'}</td>
                      <td className="p-2">{apt.funcionario_nome || 'N/A'}</td>
                      <td className="p-2">{apt.cliente_nome || 'N/A'}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                          apt.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          apt.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                          apt.status === 'concluido' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {apt.servico_duracao || 'N/A'} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RelatorioAgendamentos;
