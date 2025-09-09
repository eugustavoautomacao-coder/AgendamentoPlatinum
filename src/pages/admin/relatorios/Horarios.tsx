import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  Download, 
  Filter, 
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  CalendarDays
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay, getDay, getHours, getMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToExcel, exportToPDF, formatPercentage, formatDate } from '@/utils/exportUtils';
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

const RelatorioHorarios = () => {
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
  const [timeSlotFilter, setTimeSlotFilter] = useState<string>('all');

  // Dados filtrados
  const filteredData = useMemo(() => {
    let filtered = appointments.filter(apt => apt.status === 'concluido');

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

    return filtered;
  }, [appointments, dateRange]);

  // Cálculos do relatório
  const reportData = useMemo(() => {
    const totalAppointments = filteredData.length;
    
    // Agrupamento por dia da semana
    const weeklyDistribution = filteredData.reduce((acc, apt) => {
      const dayOfWeek = getDay(parseISO(apt.data_hora));
      const dayName = format(parseISO(apt.data_hora), 'EEEE', { locale: ptBR });
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupamento por horário (faixas de 2 horas)
    const hourlyDistribution = filteredData.reduce((acc, apt) => {
      const hour = getHours(parseISO(apt.data_hora));
      let timeSlot = '';
      
      if (hour >= 6 && hour < 8) timeSlot = '06:00 - 08:00';
      else if (hour >= 8 && hour < 10) timeSlot = '08:00 - 10:00';
      else if (hour >= 10 && hour < 12) timeSlot = '10:00 - 12:00';
      else if (hour >= 12 && hour < 14) timeSlot = '12:00 - 14:00';
      else if (hour >= 14 && hour < 16) timeSlot = '14:00 - 16:00';
      else if (hour >= 16 && hour < 18) timeSlot = '16:00 - 18:00';
      else if (hour >= 18 && hour < 20) timeSlot = '18:00 - 20:00';
      else if (hour >= 20 && hour < 22) timeSlot = '20:00 - 22:00';
      else timeSlot = 'Outros';
      
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupamento por mês
    const monthlyDistribution = filteredData.reduce((acc, apt) => {
      const month = format(parseISO(apt.data_hora), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Horários de pico (top 5 horários mais ocupados)
    const peakHours = filteredData.reduce((acc, apt) => {
      const hour = getHours(parseISO(apt.data_hora));
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPeakHours = Object.entries(peakHours)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({ hour, count }));

    // Taxa de ocupação por dia da semana
    const workingHoursPerDay = 8; // 8 horas de trabalho por dia
    const totalDays = dateRange.from && dateRange.to 
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 30;
    
    const weeklyOccupancy = Object.entries(weeklyDistribution).reduce((acc, [day, appointments]) => {
      const workingDays = Math.ceil(totalDays / 7); // Aproximação de dias úteis
      const totalWorkingHours = workingDays * workingHoursPerDay;
      const totalAppointmentHours = appointments * 1; // 1 hora por agendamento (média)
      acc[day] = totalWorkingHours > 0 ? (totalAppointmentHours / totalWorkingHours) * 100 : 0;
      return acc;
    }, {} as Record<string, number>);

    // Horários mais solicitados por serviço
    const serviceTimePreferences = filteredData.reduce((acc, apt) => {
      const serviceName = apt.servico_nome || 'Serviço não identificado';
      const hour = getHours(parseISO(apt.data_hora));
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!acc[serviceName]) {
        acc[serviceName] = {};
      }
      
      if (!acc[serviceName][timeSlot]) {
        acc[serviceName][timeSlot] = 0;
      }
      
      acc[serviceName][timeSlot] += 1;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Calcular taxa de ocupação média
    const averageOccupancyRate = Object.values(weeklyOccupancy).length > 0 
      ? Object.values(weeklyOccupancy).reduce((sum, rate) => sum + rate, 0) / Object.values(weeklyOccupancy).length
      : 0;

    return {
      totalAppointments,
      weeklyDistribution,
      hourlyDistribution,
      monthlyDistribution,
      topPeakHours,
      weeklyOccupancy,
      averageOccupancyRate,
      serviceTimePreferences
    };
  }, [filteredData, dateRange]);

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    // Dados para gráfico de linha (distribuição mensal)
    const monthlyChartData = Object.entries(reportData.monthlyDistribution)
      .map(([month, count]) => ({
        month: format(new Date(month + '-01'), 'MMM/yy'),
        appointments: count,
        fullMonth: month
      }))
      .sort((a, b) => new Date(a.fullMonth + '-01').getTime() - new Date(b.fullMonth + '-01').getTime());

    // Dados para gráfico de pizza (distribuição semanal)
    const pieChartData = Object.entries(reportData.weeklyDistribution)
      .map(([day, count]) => ({
        name: day.charAt(0).toUpperCase() + day.slice(1),
        value: count
      }))
      .sort((a, b) => {
        const daysOrder = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
        return daysOrder.indexOf(a.name) - daysOrder.indexOf(b.name);
      });

    // Dados para gráfico de barras (distribuição por faixa horária)
    const hourlyChartData = Object.entries(reportData.hourlyDistribution)
      .map(([timeSlot, count]) => ({
        timeSlot,
        appointments: count
      }))
      .sort((a, b) => {
        const timeOrder = [
          '06:00 - 08:00', '08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00',
          '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00', '20:00 - 22:00', 'Outros'
        ];
        return timeOrder.indexOf(a.timeSlot) - timeOrder.indexOf(b.timeSlot);
      });

    return {
      monthly: monthlyChartData,
      pie: pieChartData,
      hourly: hourlyChartData
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
          <p className="text-cyan-600 font-semibold">
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
          <p className="text-cyan-600 font-semibold">
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
      ['Relatório de Horários'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      [''],
      ['RESUMO'],
      ['Total de Agendamentos:', (reportData.totalAppointments || 0).toString()],
      ['Dia Mais Ocupado:', reportData.busiestDay || 'N/A'],
      ['Horário de Pico:', reportData.peakHour || 'N/A'],
      ['Taxa de Ocupação Média:', formatPercentage(reportData.averageOccupancyRate || 0)],
      [''],
      ['DETALHAMENTO DE AGENDAMENTOS'],
      ['Data', 'Hora', 'Dia da Semana', 'Faixa Horária', 'Serviço', 'Profissional', 'Cliente'],
      ...filteredData.map(apt => [
        formatDate(apt.data_hora),
        format(parseISO(apt.data_hora), 'HH:mm'),
        format(parseISO(apt.data_hora), 'EEEE', { locale: ptBR }),
        (() => {
          const hour = getHours(parseISO(apt.data_hora));
          if (hour >= 6 && hour < 8) return '06:00 - 08:00';
          else if (hour >= 8 && hour < 10) return '08:00 - 10:00';
          else if (hour >= 10 && hour < 12) return '10:00 - 12:00';
          else if (hour >= 12 && hour < 14) return '12:00 - 14:00';
          else if (hour >= 14 && hour < 16) return '14:00 - 16:00';
          else if (hour >= 16 && hour < 18) return '16:00 - 18:00';
          else if (hour >= 18 && hour < 20) return '18:00 - 20:00';
          else if (hour >= 20 && hour < 22) return '20:00 - 22:00';
          else return 'Outros';
        })(),
        apt.servico_nome || 'N/A',
        apt.funcionario_nome || 'N/A',
        apt.cliente_nome || 'N/A'
      ]),
      [''],
      ['DISTRIBUIÇÃO MENSAL'],
      ['Mês', 'Agendamentos'],
      ...chartData.monthly.map(item => [
        item.month,
        (item.appointments || 0).toString()
      ]),
      [''],
      ['DISTRIBUIÇÃO SEMANAL'],
      ['Dia da Semana', 'Agendamentos', 'Percentual'],
      ...chartData.weekly.map(item => [
        item.day,
        (item.appointments || 0).toString(),
        formatPercentage(((item.appointments || 0) / (reportData.totalAppointments || 1)) * 100)
      ]),
      [''],
      ['DISTRIBUIÇÃO HORÁRIA'],
      ['Faixa Horária', 'Agendamentos'],
      ...chartData.hourly.map(item => [
        item.hour,
        (item.appointments || 0).toString()
      ]),
      [''],
      ['TOP 5 HORÁRIOS DE PICO'],
      ['Faixa Horária', 'Agendamentos'],
      ...chartData.topPeakHours.map(item => [
        item.hour,
        (item.appointments || 0).toString()
      ])
    ];

    const result = exportToExcel(data, 'relatorio-horarios', 'Horarios');
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
      ['Dia Mais Ocupado:', reportData.busiestDay || 'N/A'],
      ['Horário de Pico:', reportData.peakHour || 'N/A'],
      ['Taxa de Ocupação Média:', formatPercentage(reportData.averageOccupancyRate || 0)],
      [''],
      ['DISTRIBUIÇÃO SEMANAL'],
      ['Dia da Semana', 'Agendamentos', 'Percentual'],
      ...(chartData.weekly || []).map(item => [
        item.day,
        (item.appointments || 0).toString(),
        formatPercentage(((item.appointments || 0) / (reportData.totalAppointments || 1)) * 100)
      ]),
      [''],
      ['DISTRIBUIÇÃO HORÁRIA'],
      ['Faixa Horária', 'Agendamentos', 'Percentual'],
      ...(chartData.hourly || []).map(item => [
        item.hour,
        (item.appointments || 0).toString(),
        formatPercentage(((item.appointments || 0) / (reportData.totalAppointments || 1)) * 100)
      ])
    ];

    exportToPDF(data, 'relatorio-horarios', 'Relatório de Horários');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/admin/relatorios')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Clock className="h-8 w-8 text-cyan-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatório de Horários</h1>
              <p className="text-muted-foreground">
                Análise de distribuição e ocupação dos horários
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
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
              <CardTitle className="text-sm font-medium">Dia Mais Ocupado</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(() => {
                  const maxDay = Object.entries(reportData.weeklyDistribution)
                    .reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: '', count: 0 });
                  return maxDay.day.charAt(0).toUpperCase() + maxDay.day.slice(1);
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                Com mais agendamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horário de Pico</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportData.topPeakHours[0]?.hour || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Mais solicitado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                {(() => {
                  const avgOccupancy = Object.values(reportData.weeklyOccupancy).reduce((sum, rate) => sum + rate, 0);
                  return Object.keys(reportData.weeklyOccupancy).length > 0 
                    ? (avgOccupancy / Object.keys(reportData.weeklyOccupancy).length).toFixed(1)
                    : '0';
                })()}%
              </div>
              <p className="text-xs text-muted-foreground">
                Média semanal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Distribuição Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Mensal de Agendamentos</CardTitle>
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
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2 }}
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

          {/* Gráfico de Distribuição Semanal */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Dia da Semana</CardTitle>
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

        {/* Gráfico de Distribuição por Faixa Horária */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Faixa Horária</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.hourly.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData.hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timeSlot" 
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
                    fill="#06b6d4" 
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

        {/* Gráfico de Top Horários de Pico */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Horários de Pico</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.topPeakHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={reportData.topPeakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="hour" 
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
                    dataKey="count" 
                    fill="#06b6d4" 
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
            <CardTitle>Detalhamento de Horários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Hora</th>
                    <th className="text-left p-2">Dia da Semana</th>
                    <th className="text-left p-2">Faixa Horária</th>
                    <th className="text-left p-2">Serviço</th>
                    <th className="text-left p-2">Profissional</th>
                    <th className="text-left p-2">Cliente</th>
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
                      <td className="p-2">
                        {format(parseISO(apt.data_hora), 'EEEE', { locale: ptBR })}
                      </td>
                      <td className="p-2">
                        {(() => {
                          const hour = getHours(parseISO(apt.data_hora));
                          if (hour >= 6 && hour < 8) return '06:00 - 08:00';
                          else if (hour >= 8 && hour < 10) return '08:00 - 10:00';
                          else if (hour >= 10 && hour < 12) return '10:00 - 12:00';
                          else if (hour >= 12 && hour < 14) return '12:00 - 14:00';
                          else if (hour >= 14 && hour < 16) return '14:00 - 16:00';
                          else if (hour >= 16 && hour < 18) return '16:00 - 18:00';
                          else if (hour >= 18 && hour < 20) return '18:00 - 20:00';
                          else if (hour >= 20 && hour < 22) return '20:00 - 22:00';
                          else return 'Outros';
                        })()}
                      </td>
                      <td className="p-2">{apt.servico_nome || 'N/A'}</td>
                      <td className="p-2">{apt.funcionario_nome || 'N/A'}</td>
                      <td className="p-2">{apt.cliente_nome || 'N/A'}</td>
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

export default RelatorioHorarios;
