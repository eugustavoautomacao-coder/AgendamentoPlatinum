import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Download, 
  Filter, 
  ArrowLeft,
  BarChart3,
  PieChart,
  Clock,
  TrendingUp,
  Star,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useProfessionals } from "@/hooks/useProfessionals";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
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

const RelatorioFuncionarios = () => {
  const navigate = useNavigate();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { professionals, loading: professionalsLoading } = useProfessionals();

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

  const loading = appointmentsLoading || professionalsLoading;

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

    return filtered;
  }, [appointments, dateRange, professionalFilter]);

  // Cálculos do relatório
  const reportData = useMemo(() => {
    const totalProfessionals = professionals.length;
    const totalAppointments = filteredData.length;
    
    // Agrupamento por profissional
    const professionalStats = filteredData.reduce((acc, apt) => {
      const professionalId = apt.funcionario_id;
      const professionalName = apt.funcionario_nome || 'Profissional não identificado';
      
      if (!acc[professionalId]) {
        acc[professionalId] = {
          name: professionalName,
          appointments: 0,
          totalRevenue: 0,
          totalDuration: 0,
          averageRating: 0,
          totalCommissions: 0
        };
      }
      
      acc[professionalId].appointments += 1;
      acc[professionalId].totalRevenue += apt.servico_preco || 0;
      acc[professionalId].totalDuration += apt.servico_duracao || 0;
      acc[professionalId].totalCommissions += (apt.servico_preco || 0) * 0.15; // 15% de comissão
      
      return acc;
    }, {} as Record<string, {
      name: string;
      appointments: number;
      totalRevenue: number;
      totalDuration: number;
      averageRating: number;
      totalCommissions: number;
    }>);

    // Calcular médias
    Object.values(professionalStats).forEach(prof => {
      prof.averageRating = prof.appointments > 0 ? 4.5 : 0; // Rating simulado
    });

    // Agrupamento por mês (performance dos profissionais)
    const monthlyPerformance = filteredData.reduce((acc, apt) => {
      const month = format(parseISO(apt.data_hora), 'yyyy-MM');
      const professionalName = apt.funcionario_nome || 'Profissional não identificado';
      
      if (!acc[month]) {
        acc[month] = {};
      }
      
      if (!acc[month][professionalName]) {
        acc[month][professionalName] = {
          appointments: 0,
          revenue: 0
        };
      }
      
      acc[month][professionalName].appointments += 1;
      acc[month][professionalName].revenue += apt.servico_preco || 0;
      
      return acc;
    }, {} as Record<string, Record<string, { appointments: number; revenue: number }>>);

    // Top profissionais por receita
    const topProfessionalsByRevenue = Object.values(professionalStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Top profissionais por agendamentos
    const topProfessionalsByAppointments = Object.values(professionalStats)
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 5);

    // Calcular receita total
    const totalRevenue = Object.values(professionalStats)
      .reduce((sum, prof) => sum + prof.totalRevenue, 0);

    return {
      totalProfessionals,
      totalAppointments,
      totalRevenue,
      professionalStats,
      monthlyPerformance,
      topProfessionalsByRevenue,
      topProfessionalsByAppointments
    };
  }, [professionals, filteredData]);

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    // Dados para gráfico de linha (performance mensal)
    const monthlyChartData = Object.entries(reportData.monthlyPerformance)
      .map(([month, profs]) => {
        const totalAppointments = Object.values(profs).reduce((sum, prof) => sum + prof.appointments, 0);
        const totalRevenue = Object.values(profs).reduce((sum, prof) => sum + prof.revenue, 0);
        
        return {
          month: format(new Date(month + '-01'), 'MMM/yy'),
          appointments: totalAppointments,
          revenue: Number(totalRevenue.toFixed(2)),
          fullMonth: month
        };
      })
      .sort((a, b) => new Date(a.fullMonth + '-01').getTime() - new Date(b.fullMonth + '-01').getTime());

    // Dados para gráfico de pizza (distribuição por profissional)
    const pieChartData = Object.values(reportData.professionalStats)
      .map(prof => ({
        name: prof.name,
        value: Number(prof.totalRevenue.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 profissionais

    // Dados para gráfico de barras (top profissionais por receita)
    const topRevenueData = reportData.topProfessionalsByRevenue.map(prof => ({
      name: prof.name,
      revenue: Number(prof.totalRevenue.toFixed(2)),
      appointments: prof.appointments
    }));

    return {
      monthly: monthlyChartData,
      pie: pieChartData,
      topRevenue: topRevenueData
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
          <p className="text-teal-600 font-semibold">
            {`Agendamentos: ${payload[0].value}`}
          </p>
          <p className="text-teal-600 font-semibold">
            {`Receita: R$ ${payload[1].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip para gráfico de pizza
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const totalRevenue = Object.values(reportData.professionalStats)
        .reduce((sum, prof) => sum + prof.totalRevenue, 0);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-teal-600 font-semibold">
            {`R$ ${payload[0].value.toFixed(2)}`}
          </p>
          <p className="text-gray-500 text-sm">
            {`${((payload[0].value / totalRevenue) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Exportar para Excel
  const handleExportExcel = () => {
    const data = [
      ['Relatório de Funcionários'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      [''],
      ['RESUMO'],
              ['Total de Profissionais:', (reportData.totalProfessionals || 0).toString()],
        ['Total de Agendamentos:', (reportData.totalAppointments || 0).toString()],
        ['Média por Profissional:', (reportData.averagePerProfessional || 0).toString()],
      ['Rating Médio Geral:', reportData.averageRating.toFixed(1)],
      [''],
      ['PERFORMANCE POR PROFISSIONAL'],
      ['Profissional', 'Total de Agendamentos', 'Receita Total', 'Duração Total (min)', 'Comissões', 'Rating Médio', 'Percentual da Receita'],
      ...Object.values(reportData.professionalStats).map(prof => [
        prof.name,
        (prof.appointments || 0).toString(),
        formatCurrency(prof.totalRevenue || 0),
        (prof.totalDuration || 0).toString(),
        formatCurrency(prof.totalCommissions || 0),
        (prof.averageRating || 0).toFixed(1),
        formatPercentage(((prof.totalRevenue || 0) / (reportData.totalRevenue || 1)) * 100)
      ]),
      [''],
      ['EVOLUÇÃO MENSAL'],
      ['Mês', 'Agendamentos', 'Receita'],
      ...(chartData.monthly || []).map(item => [
        item.month,
        (item.appointments || 0).toString(),
        formatCurrency(item.revenue || 0)
      ]),
      [''],
      ['TOP 5 PROFISSIONAIS'],
      ['Profissional', 'Receita', 'Agendamentos'],
      ...(chartData.topProfessionals || []).map(item => [
        item.name,
        formatCurrency(item.revenue),
        (item.appointments || 0).toString()
      ])
    ];

    const result = exportToExcel(data, 'relatorio-funcionarios', 'Funcionarios');
    if (result.success) {
      console.log(result.message);
    }
  };

  // Exportar para PDF
  const handleExportPDF = () => {
    const data = [
      ['RESUMO EXECUTIVO'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      ['Total de Profissionais:', (reportData.totalProfessionals || 0).toString()],
      ['Total de Agendamentos:', (reportData.totalAppointments || 0).toString()],
      ['Rating Médio Geral:', (reportData.averageRating || 0).toFixed(1)],
      ['Receita Total:', formatCurrency(reportData.totalRevenue || 0)],
      [''],
      ['DISTRIBUIÇÃO POR PROFISSIONAL'],
      ['Profissional', 'Receita', 'Percentual'],
      ...(chartData.pie || []).map(item => [
        item.name,
        formatCurrency(item.value || 0),
        formatPercentage(((item.value || 0) / (reportData.totalRevenue || 1)) * 100)
      ]),
      [''],
      ['EVOLUÇÃO MENSAL'],
      ['Mês', 'Total Agendamentos', 'Receita Total'],
      ...(chartData.monthly || []).map(item => [
        item.month,
        (item.appointments || 0).toString(),
        formatCurrency(item.revenue || 0)
      ])
    ];

    exportToPDF(data, 'relatorio-funcionarios', 'Relatório de Funcionários');
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
            <Users className="h-8 w-8 text-teal-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatório de Funcionários</h1>
              <p className="text-muted-foreground">
                Análise de performance e produtividade dos profissionais
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
              <CardTitle className="text-sm font-medium">Total de Profissionais</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.totalProfessionals}
              </div>
              <p className="text-xs text-muted-foreground">
                Cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportData.totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Profissional</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.totalProfessionals > 0 
                  ? Math.round(reportData.totalAppointments / reportData.totalProfessionals)
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Agendamentos por profissional
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating Médio</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                4.5
              </div>
              <p className="text-xs text-muted-foreground">
                Avaliação dos clientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Performance Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Mensal dos Profissionais</CardTitle>
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
                      yAxisId="left"
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="appointments"
                      stroke="#14b8a6"
                      strokeWidth={3}
                      dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#14b8a6', strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
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

          {/* Gráfico de Distribuição por Profissional */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Profissional</CardTitle>
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

        {/* Gráfico de Top Profissionais por Receita */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Profissionais por Receita</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.topRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData.topRevenue}>
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
                    formatter={(value: any, name: any) => [
                      name === 'revenue' ? `R$ ${value.toFixed(2)}` : value, 
                      name === 'revenue' ? 'Receita' : 'Agendamentos'
                    ]}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#14b8a6" 
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
            <CardTitle>Detalhamento de Profissionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Profissional</th>
                    <th className="text-center p-2">Agendamentos</th>
                    <th className="text-right p-2">Receita Total</th>
                    <th className="text-center p-2">Duração Total</th>
                    <th className="text-right p-2">Comissões</th>
                    <th className="text-center p-2">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(reportData.professionalStats)
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((prof, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{prof.name}</td>
                      <td className="p-2 text-center">{prof.appointments}</td>
                      <td className="p-2 text-right font-medium text-green-600">
                        R$ {prof.totalRevenue.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        {prof.totalDuration} min
                      </td>
                      <td className="p-2 text-right font-medium text-blue-600">
                        R$ {prof.totalCommissions.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{prof.averageRating.toFixed(1)}</span>
                        </div>
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

export default RelatorioFuncionarios;
