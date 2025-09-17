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
  TrendingUp,
  UserPlus,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay, differenceInDays } from "date-fns";
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

const RelatorioClientes = () => {
  const navigate = useNavigate();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { clients, loading: clientsLoading } = useClients();

  // Estados para filtros
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('all');

  const loading = appointmentsLoading || clientsLoading;

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
    const totalClients = clients.length;
    const totalAppointments = filteredData.length;
    
    // Clientes novos (primeira visita no período)
    const newClients = new Set();
    const returningClients = new Set();
    
    filteredData.forEach(apt => {
      if (apt.cliente_id) {
        if (!newClients.has(apt.cliente_id)) {
          newClients.add(apt.cliente_id);
        } else {
          returningClients.add(apt.cliente_id);
        }
      }
    });

    // Agrupamento por cliente
    const clientStats = filteredData.reduce((acc, apt) => {
      const clientId = apt.cliente_id;
      if (!clientId) return acc;
      
      if (!acc[clientId]) {
        acc[clientId] = {
          name: apt.cliente_nome || 'Cliente não identificado',
          appointments: 0,
          totalSpent: 0,
          lastVisit: apt.data_hora,
          firstVisit: apt.data_hora
        };
      }
      
      acc[clientId].appointments += 1;
      acc[clientId].totalSpent += apt.servico_preco || 0;
      
      const aptDate = parseISO(apt.data_hora);
      const lastVisit = parseISO(acc[clientId].lastVisit);
      const firstVisit = parseISO(acc[clientId].firstVisit);
      
      if (aptDate > lastVisit) {
        acc[clientId].lastVisit = apt.data_hora;
      }
      if (aptDate < firstVisit) {
        acc[clientId].firstVisit = apt.data_hora;
      }
      
      return acc;
    }, {} as Record<string, {
      name: string;
      appointments: number;
      totalSpent: number;
      lastVisit: string;
      firstVisit: string;
    }>);

    // Segmentação por valor gasto
    const highValueClients = Object.values(clientStats).filter(client => client.totalSpent >= 500);
    const mediumValueClients = Object.values(clientStats).filter(client => client.totalSpent >= 200 && client.totalSpent < 500);
    const lowValueClients = Object.values(clientStats).filter(client => client.totalSpent < 200);

    // Agrupamento por mês (novos clientes)
    const monthlyNewClients = filteredData.reduce((acc, apt) => {
      const month = format(parseISO(apt.data_hora), 'yyyy-MM');
      const clientId = apt.cliente_id;
      
      if (!acc[month]) {
        acc[month] = new Set();
      }
      
      if (clientId && !acc[month].has(clientId)) {
        acc[month].add(clientId);
      }
      
      return acc;
    }, {} as Record<string, Set<string>>);

    const monthlyNewClientsCount = Object.entries(monthlyNewClients).reduce((acc, [month, clientSet]) => {
      acc[month] = clientSet.size;
      return acc;
    }, {} as Record<string, number>);

    // Calcular taxa de retenção
    const retentionRate = totalClients > 0 ? (returningClients.size / totalClients) * 100 : 0;

    return {
      totalClients,
      totalAppointments,
      newClientsCount: newClients.size,
      returningClientsCount: returningClients.size,
      retentionRate,
      clientStats,
      highValueClients: highValueClients.length,
      mediumValueClients: mediumValueClients.length,
      lowValueClients: lowValueClients.length,
      monthlyNewClientsCount
    };
  }, [clients, filteredData]);

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    // Dados para gráfico de linha (novos clientes mensais)
    const monthlyChartData = Object.entries(reportData.monthlyNewClientsCount)
      .map(([month, count]) => ({
        month: format(new Date(month + '-01'), 'MMM/yy'),
        newClients: count,
        fullMonth: month
      }))
      .sort((a, b) => new Date(a.fullMonth + '-01').getTime() - new Date(b.fullMonth + '-01').getTime());

    // Dados para gráfico de pizza (segmentação por valor)
    const pieChartData = [
      { name: 'Alto Valor (R$ 500+)', value: reportData.highValueClients },
      { name: 'Médio Valor (R$ 200-499)', value: reportData.mediumValueClients },
      { name: 'Baixo Valor (< R$ 200)', value: reportData.lowValueClients }
    ].filter(item => item.value > 0);

    // Dados para gráfico de barras (top clientes)
    const topClientsData = Object.values(reportData.clientStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(client => ({
        name: client.name,
        value: Number(client.totalSpent.toFixed(2)),
        appointments: client.appointments
      }));

    return {
      monthly: monthlyChartData,
      pie: pieChartData,
      topClients: topClientsData
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
          <p className="text-purple-600 font-semibold">
            {`Novos Clientes: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip para gráfico de pizza
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = reportData.highValueClients + reportData.mediumValueClients + reportData.lowValueClients;
      const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-purple-600 font-semibold">
            {`${payload[0].value} clientes`}
          </p>
          <p className="text-gray-500 text-sm">
            {`${percentage}% do total`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Exportar para Excel
  const handleExportExcel = () => {
    const data = [
      ['Relatório de Clientes'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      [''],
      ['RESUMO'],
              ['Total de Clientes:', (reportData.totalClients || 0).toString()],
        ['Novos Clientes:', (reportData.newClients || 0).toString()],
        ['Clientes Recorrentes:', (reportData.recurringClients || 0).toString()],
        ['Total de Agendamentos:', (reportData.totalAppointments || 0).toString()],
      [''],
      ['ANÁLISE DE CLIENTES'],
      ['Cliente', 'Total de Agendamentos', 'Valor Total Gasto', 'Primeira Visita', 'Última Visita', 'Tipo'],
      ...Object.values(reportData.clientStats).map(client => [
        client.name,
        (client.appointments || 0).toString(),
        formatCurrency(client.totalSpent),
        formatDate(client.firstVisit),
        formatDate(client.lastVisit),
        client.isNew ? 'Novo' : 'Recorrente'
      ]),
      [''],
      ['CRESCIMENTO MENSAL'],
      ['Mês', 'Novos Clientes'],
      ...(chartData.monthly || []).map(item => [
        item.month,
        (item.newClients || 0).toString()
      ]),
      [''],
      ['TOP 10 CLIENTES'],
      ['Cliente', 'Valor Total Gasto', 'Agendamentos'],
      ...(chartData.topClients || []).map(item => [
        item.name,
        formatCurrency(item.totalSpent),
        (item.appointments || 0).toString()
      ])
    ];

    const result = exportToExcel(data, 'relatorio-clientes', 'Clientes');
    if (result.success) {
      console.log(result.message);
    }
  };

  // Exportar para PDF
  const handleExportPDF = () => {
    const data = [
      ['RESUMO EXECUTIVO'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      ['Total de Clientes:', (reportData.totalClients || 0).toString()],
      ['Novos Clientes:', (reportData.newClients || 0).toString()],
      ['Clientes Recorrentes:', (reportData.recurringClients || 0).toString()],
      ['Taxa de Retenção:', formatPercentage(reportData.retentionRate || 0)],
      [''],
      ['DISTRIBUIÇÃO POR SEGMENTO'],
      ['Segmento', 'Quantidade', 'Percentual'],
      ...(chartData.pie || []).map(item => [
        item.name,
        (item.value || 0).toString(),
        formatPercentage(((item.value || 0) / (reportData.totalClients || 1)) * 100)
      ]),
      [''],
      ['EVOLUÇÃO MENSAL'],
      ['Mês', 'Novos Clientes', 'Clientes Ativos'],
      ...(chartData.monthly || []).map(item => [
        item.month,
        (item.newClients || 0).toString(),
        (item.activeClients || 0).toString()
      ])
    ];

    exportToPDF(data, 'relatorio-clientes', 'Relatório de Clientes');
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
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Relatório de Clientes</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Análise de clientes, fidelização e segmentação
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
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.totalClients}
              </div>
              <p className="text-xs text-muted-foreground">
                Cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportData.newClientsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Recorrentes</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.returningClientsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Múltiplas visitas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agendamentos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Novos Clientes Mensais */}
          <Card>
            <CardHeader>
              <CardTitle>Novos Clientes Mensais</CardTitle>
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
                      dataKey="newClients"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
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

          {/* Gráfico de Segmentação por Valor */}
          <Card>
            <CardHeader>
              <CardTitle>Segmentação por Valor</CardTitle>
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

        {/* Gráfico de Barras - Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes por Valor Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.topClients.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData.topClients}>
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
                      `R$ ${value.toFixed(2)}`, 
                      'Valor Gasto'
                    ]}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8b5cf6" 
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
            <CardTitle>Detalhamento de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-center p-2">Agendamentos</th>
                    <th className="text-right p-2">Valor Total</th>
                    <th className="text-center p-2">Primeira Visita</th>
                    <th className="text-center p-2">Última Visita</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(reportData.clientStats)
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .map((client, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{client.name}</td>
                      <td className="p-2 text-center">{client.appointments}</td>
                      <td className="p-2 text-right font-medium">
                        R$ {client.totalSpent.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        {format(parseISO(client.firstVisit), 'dd/MM/yyyy')}
                      </td>
                      <td className="p-2 text-center">
                        {format(parseISO(client.lastVisit), 'dd/MM/yyyy')}
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

export default RelatorioClientes;
