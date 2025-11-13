import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter, 
  ArrowLeft,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToExcel, exportToPDF, formatCurrency, formatDate, formatPercentage } from '@/utils/exportUtils';
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

const RelatorioFaturamento = () => {
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
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

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

    // Filtro por profissional
    if (professionalFilter !== 'all') {
      filtered = filtered.filter(apt => apt.funcionario_id === professionalFilter);
    }

    // Filtro por serviço
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.servico_id === serviceFilter);
    }

    return filtered;
  }, [appointments, dateRange, professionalFilter, serviceFilter]);

  // Cálculos do relatório
  const reportData = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, apt) => sum + (apt.servico_preco || 0), 0);
    const totalAppointments = filteredData.length;
    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    // Agrupamento por dia
    const dailyRevenue = filteredData.reduce((acc, apt) => {
      const date = format(parseISO(apt.data_hora), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + (apt.servico_preco || 0);
      return acc;
    }, {} as Record<string, number>);

    // Agrupamento por serviço
    const serviceRevenue = filteredData.reduce((acc, apt) => {
      const serviceName = apt.servico_nome || 'Serviço não identificado';
      acc[serviceName] = (acc[serviceName] || 0) + (apt.servico_preco || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalAppointments,
      averageTicket,
      dailyRevenue,
      serviceRevenue
    };
  }, [filteredData]);

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    // Dados para gráfico de linha (faturamento diário)
    const dailyChartData = Object.entries(reportData.dailyRevenue)
      .map(([date, revenue]) => ({
        date: format(new Date(date), 'dd/MM'),
        revenue: Number(revenue.toFixed(2)),
        fullDate: date
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    // Dados para gráfico de pizza (faturamento por serviço)
    const pieChartData = Object.entries(reportData.serviceRevenue)
      .map(([service, revenue]) => ({
        name: service,
        value: Number(revenue.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 serviços

    return {
      daily: dailyChartData,
      pie: pieChartData
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
          <p className="font-medium text-gray-900">{`Data: ${label}`}</p>
          <p className="text-green-600 font-semibold">
            {`Faturamento: R$ ${payload[0].value.toFixed(2)}`}
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
          <p className="text-green-600 font-semibold">
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
      ['Relatório de Faturamento'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      [''],
      ['RESUMO'],
      ['Receita Total:', formatCurrency(reportData.totalRevenue || 0)],
              ['Total de Agendamentos:', (reportData.totalAppointments || 0).toString()],
      ['Receita Média por Agendamento:', formatCurrency(reportData.averageTicket || 0)],
      [''],
      ['DETALHAMENTO DIÁRIO'],
      ['Data', 'Receita'],
      ...(chartData.daily || []).map(item => [
        item.date,
        formatCurrency(item.revenue || 0)
      ]),
      [''],
      ['DISTRIBUIÇÃO POR SERVIÇO'],
      ['Serviço', 'Receita', 'Percentual'],
      ...(chartData.pie || []).map(item => [
        item.name,
        formatCurrency(item.value || 0),
        formatPercentage(((item.value || 0) / (reportData.totalRevenue || 1)) * 100)
      ]),
      [''],
      ['TOP SERVIÇOS'],
      ['Serviço', 'Receita'],
      ...(chartData.pie || []).slice(0, 5).map(item => [
        item.name,
        formatCurrency(item.value || 0)
      ])
    ];

    const result = exportToExcel(data, 'relatorio-faturamento', 'Faturamento');
    if (result.success) {
      console.log(result.message);
    }
  };

  // Exportar para PDF
  const handleExportPDF = () => {
    const data = [
      ['RESUMO EXECUTIVO'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      ['Receita Total:', formatCurrency(reportData.totalRevenue || 0)],
      ['Total de Agendamentos:', (reportData.totalAppointments || 0).toString()],
      ['Ticket Médio:', formatCurrency(reportData.averageTicket || 0)],
      [''],
      ['DISTRIBUIÇÃO POR SERVIÇO'],
      ['Serviço', 'Receita', 'Percentual'],
      ...(chartData.pie || []).map(item => [
        item.name,
        formatCurrency(item.value || 0),
        formatPercentage(((item.value || 0) / (reportData.totalRevenue || 1)) * 100)
      ]),
      [''],
      ['EVOLUÇÃO DIÁRIA'],
      ['Data', 'Receita'],
      ...(chartData.daily || []).map(item => [
        formatDate(item.date),
        formatCurrency(item.revenue || 0)
      ])
    ];

    exportToPDF(data, 'relatorio-faturamento', 'Relatório de Faturamento');
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
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Relatório de Faturamento</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Análise completa de receita e performance financeira
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
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div>
                <label className="text-sm font-medium mb-2 block">Profissional</label>
                <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {/* Adicionar profissionais aqui */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {reportData.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.totalAppointments} agendamentos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {reportData.averageTicket.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor médio por agendamento
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Serviços</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {reportData.totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                Serviços realizados no período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico de Faturamento Diário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Faturamento Diário</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsLineChart data={chartData.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
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
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Nenhum dado disponível para o período selecionado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Faturamento por Serviço */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Faturamento por Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.pie.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
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

        {/* Gráfico de Barras - Top Serviços */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Top Serviços por Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.pie.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={chartData.pie}>
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
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
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
                    <th className="text-left p-2">Serviço</th>
                    <th className="text-left p-2">Profissional</th>
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-right p-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((apt, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {format(parseISO(apt.data_hora), 'dd/MM/yyyy')}
                      </td>
                      <td className="p-2">{apt.servico_nome || 'N/A'}</td>
                      <td className="p-2">{apt.funcionario_nome || 'N/A'}</td>
                      <td className="p-2">{apt.cliente_nome || 'N/A'}</td>
                      <td className="p-2 text-right font-medium">
                        R$ {(apt.servico_preco || 0).toFixed(2)}
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

export default RelatorioFaturamento;
