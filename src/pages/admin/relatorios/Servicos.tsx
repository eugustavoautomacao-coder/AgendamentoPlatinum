import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scissors, 
  Calendar, 
  Download, 
  Filter, 
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useServices } from "@/hooks/useServices";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToExcel, exportToPDF, formatCurrency, formatPercentage } from '@/utils/exportUtils';
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

const RelatorioServicos = () => {
  const navigate = useNavigate();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { services, loading: servicesLoading } = useServices();

  // Estados para filtros
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const loading = appointmentsLoading || servicesLoading;

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

    // Filtro por serviço
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.servico_id === serviceFilter);
    }

    return filtered;
  }, [appointments, dateRange, serviceFilter]);

  // Cálculos do relatório
  const reportData = useMemo(() => {
    const totalServices = filteredData.length;
    const totalRevenue = filteredData.reduce((sum, apt) => sum + (apt.servico_preco || 0), 0);
    const averagePrice = totalServices > 0 ? totalRevenue / totalServices : 0;

    // Agrupamento por serviço
    const serviceStats = filteredData.reduce((acc, apt) => {
      const serviceId = apt.servico_id;
      const serviceName = apt.servico_nome || 'Serviço não identificado';
      
      if (!acc[serviceId]) {
        acc[serviceId] = {
          name: serviceName,
          appointments: 0,
          totalRevenue: 0,
          averagePrice: 0,
          totalDuration: 0
        };
      }
      
      acc[serviceId].appointments += 1;
      acc[serviceId].totalRevenue += apt.servico_preco || 0;
      acc[serviceId].totalDuration += apt.servico_duracao || 0;
      acc[serviceId].averagePrice = acc[serviceId].totalRevenue / acc[serviceId].appointments;
      
      return acc;
    }, {} as Record<string, {
      name: string;
      appointments: number;
      totalRevenue: number;
      averagePrice: number;
      totalDuration: number;
    }>);

    // Agrupamento por mês
    const monthlyRevenue = filteredData.reduce((acc, apt) => {
      const month = format(parseISO(apt.data_hora), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + (apt.servico_preco || 0);
      return acc;
    }, {} as Record<string, number>);

    // Agrupamento por dia da semana
    const weeklyDistribution = filteredData.reduce((acc, apt) => {
      const dayOfWeek = format(parseISO(apt.data_hora), 'EEEE', { locale: ptBR });
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Cálculo de margem de lucro (estimativa)
    const estimatedCost = totalRevenue * 0.3; // 30% de custo estimado
    const estimatedProfit = totalRevenue - estimatedCost;
    const profitMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    return {
      totalServices,
      totalRevenue,
      averagePrice,
      estimatedProfit,
      profitMargin,
      serviceStats,
      monthlyRevenue,
      weeklyDistribution
    };
  }, [filteredData]);

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    // Dados para gráfico de linha (receita mensal)
    const monthlyChartData = Object.entries(reportData.monthlyRevenue)
      .map(([month, revenue]) => ({
        month: format(new Date(month + '-01'), 'MMM/yy'),
        revenue: Number(revenue.toFixed(2)),
        fullMonth: month
      }))
      .sort((a, b) => new Date(a.fullMonth + '-01').getTime() - new Date(b.fullMonth + '-01').getTime())

    // Dados para gráfico de pizza (distribuição por serviço)
    const pieChartData = Object.values(reportData.serviceStats)
      .map(service => ({
        name: service.name,
        value: Number(service.totalRevenue.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 serviços

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

    return {
      monthly: monthlyChartData,
      pie: pieChartData,
      weekly: weeklyChartData
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
          <p className="text-orange-600 font-semibold">
            {`Receita: R$ ${payload[0].value.toFixed(2)}`}
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
          <p className="text-orange-600 font-semibold">
            {`R$ ${payload[0].value.toFixed(2)}`}
          </p>
          <p className="text-gray-500 text-sm">
            {`${((payload[0].value / reportData.totalRevenue) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Exportar para Excel
  const handleExportExcel = () => {
    const data = [
      ['Relatório de Serviços'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      [''],
      ['RESUMO'],
      ['Total de Serviços:', (reportData.totalServices || 0).toString()],
      ['Receita Total:', formatCurrency(reportData.totalRevenue || 0)],
      ['Preço Médio:', formatCurrency(reportData.averagePrice || 0)],
      ['Margem de Lucro Estimada:', formatPercentage(reportData.profitMargin || 0)],
      [''],
      ['ANÁLISE POR SERVIÇO'],
      ['Serviço', 'Total de Agendamentos', 'Receita Total', 'Preço Médio', 'Duração Total (min)', 'Percentual da Receita'],
      ...Object.values(reportData.serviceStats || {}).map(service => [
        service.name || 'N/A',
        (service.appointments || 0).toString(),
        formatCurrency(service.totalRevenue || 0),
        formatCurrency(service.averagePrice || 0),
        (service.totalDuration || 0).toString(),
        formatPercentage(((service.totalRevenue || 0) / (reportData.totalRevenue || 1)) * 100)
      ]),
      [''],
      ['RECEITA MENSAL'],
      ['Mês', 'Receita'],
      ...(chartData.monthly || []).map(item => [
        item.month || 'N/A',
        formatCurrency(item.revenue || 0)
      ]),
      [''],
      ['DISTRIBUIÇÃO SEMANAL'],
      ['Dia da Semana', 'Agendamentos'],
      ...(chartData.weekly || []).map(item => [
        item.day || 'N/A',
        (item.appointments || 0).toString()
      ])
    ];

    const result = exportToExcel(data, 'relatorio-servicos', 'Servicos');
    if (result.success) {
      console.log(result.message);
    }
  };

  // Exportar para PDF
  const handleExportPDF = () => {
    const data = [
      ['Relatório de Serviços'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd-MM-yyyy')}`],
      ['Total de Serviços:', (reportData.totalServices || 0).toString()],
      ['Receita Total:', formatCurrency(reportData.totalRevenue || 0)],
      ['Margem de Lucro Estimada:', formatPercentage(reportData.profitMargin || 0)]
    ];

    exportToPDF(data, 'relatorio-servicos');
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
            <Scissors className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatório de Serviços</h1>
              <p className="text-muted-foreground">
                Análise de performance e rentabilidade dos serviços
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
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.totalServices}
              </div>
              <p className="text-xs text-muted-foreground">
                Realizados no período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {reportData.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {reportData.averagePrice.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por serviço
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.profitMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Estimativa
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Receita Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal por Serviços</CardTitle>
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
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
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

          {/* Gráfico de Distribuição por Serviço */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Serviço</CardTitle>
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
                    fill="#f97316" 
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
            <CardTitle>Detalhamento de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Serviço</th>
                    <th className="text-center p-2">Agendamentos</th>
                    <th className="text-right p-2">Receita Total</th>
                    <th className="text-right p-2">Preço Médio</th>
                    <th className="text-center p-2">Duração Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(reportData.serviceStats)
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((service, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{service.name}</td>
                      <td className="p-2 text-center">{service.appointments}</td>
                      <td className="p-2 text-right font-medium text-green-600">
                        R$ {service.totalRevenue.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        R$ {service.averagePrice.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        {service.totalDuration} min
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

export default RelatorioServicos;
