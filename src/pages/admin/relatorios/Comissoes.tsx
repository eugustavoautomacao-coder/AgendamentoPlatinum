import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter, 
  ArrowLeft,
  BarChart3,
  PieChart,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAppointments } from "@/hooks/useAppointments";
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

const RelatorioComissoes = () => {
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
    const totalCommissions = filteredData.reduce((sum, apt) => {
      const commission = (apt.servico_preco || 0) * 0.15; // 15% de comissão
      return sum + commission;
    }, 0);
    
    const totalAppointments = filteredData.length;
    const averageCommission = totalAppointments > 0 ? totalCommissions / totalAppointments : 0;

    // Agrupamento por profissional
    const professionalCommissions = filteredData.reduce((acc, apt) => {
      const professionalName = apt.funcionario_nome || 'Profissional não identificado';
      const commission = (apt.servico_preco || 0) * 0.15;
      
      if (!acc[professionalName]) {
        acc[professionalName] = {
          total: 0,
          appointments: 0,
          average: 0
        };
      }
      
      acc[professionalName].total += commission;
      acc[professionalName].appointments += 1;
      acc[professionalName].average = acc[professionalName].total / acc[professionalName].appointments;
      
      return acc;
    }, {} as Record<string, { total: number; appointments: number; average: number }>);

    // Agrupamento por mês
    const monthlyCommissions = filteredData.reduce((acc, apt) => {
      const month = format(parseISO(apt.data_hora), 'yyyy-MM');
      const commission = (apt.servico_preco || 0) * 0.15;
      
      acc[month] = (acc[month] || 0) + commission;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCommissions,
      totalAppointments,
      averageCommission,
      professionalCommissions,
      monthlyCommissions
    };
  }, [filteredData]);

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    // Dados para gráfico de linha (comissões mensais)
    const monthlyChartData = Object.entries(reportData.monthlyCommissions)
      .map(([month, commission]) => ({
        month: format(new Date(month + '-01'), 'MMM/yy'),
        commission: Number(commission.toFixed(2)),
        fullMonth: month
      }))
      .sort((a, b) => new Date(a.fullMonth + '-01').getTime() - new Date(b.fullMonth + '-01').getTime());

    // Dados para gráfico de pizza (comissões por profissional)
    const pieChartData = Object.entries(reportData.professionalCommissions)
      .map(([professional, data]) => ({
        name: professional,
        value: Number(data.total.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);

    return {
      monthly: monthlyChartData,
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
          <p className="font-medium text-gray-900">{`Mês: ${label}`}</p>
          <p className="text-blue-600 font-semibold">
            {`Comissões: R$ ${payload[0].value.toFixed(2)}`}
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
          <p className="text-blue-600 font-semibold">
            {`R$ ${payload[0].value.toFixed(2)}`}
          </p>
          <p className="text-gray-500 text-sm">
            {`${((payload[0].value / reportData.totalCommissions) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Exportar para Excel
  const handleExportExcel = () => {
    const data = [
      ['Relatório de Comissões'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`],
      [''],
      ['RESUMO'],
      ['Total de Comissões:', formatCurrency(reportData.totalCommissions)],
      ['Comissão Média:', formatCurrency(reportData.averageCommission)],
              ['Número de Profissionais:', (reportData.totalProfessionals || 0).toString()],
      [''],
      ['COMISSÕES POR PROFISSIONAL'],
      ['Profissional', 'Total de Comissões', 'Receita Total', 'Comissão Total', 'Percentual'],
      ...Object.values(reportData.professionalStats).map(prof => [
        prof.name,
        (prof.appointments || 0).toString(),
        formatCurrency(prof.totalRevenue),
        formatCurrency(prof.totalCommission),
        formatPercentage((prof.totalCommission / reportData.totalCommissions) * 100)
      ]),
      [''],
      ['EVOLUÇÃO MENSAL'],
      ['Mês', 'Comissões', 'Receita'],
      ...(chartData.monthly || []).map(item => [
        item.month,
        formatCurrency(item.commissions),
        formatCurrency(item.revenue)
      ]),
      [''],
      ['TOP PROFISSIONAIS'],
      ['Profissional', 'Comissões', 'Receita'],
      ...(chartData.topProfessionals || []).map(item => [
        item.name,
        formatCurrency(item.commissions),
        formatCurrency(item.revenue)
      ])
    ];

    const result = exportToExcel(data, 'relatorio-comissoes', 'Comissoes');
    if (result.success) {
      console.log(result.message);
    }
  };

  // Exportar para PDF
  const handleExportPDF = () => {
    const data = [
      ['Relatório de Comissões'],
      ['Período:', `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} a ${format(dateRange.to || new Date(), 'dd-MM-yyyy')}`],
      ['Total de Comissões:', formatCurrency(reportData.totalCommissions)],
      ['Comissão Média:', formatCurrency(reportData.averageCommission)]
    ];

    exportToPDF(data, 'relatorio-comissoes');
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
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatório de Comissões</h1>
              <p className="text-muted-foreground">
                Análise de comissões por profissional e período
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {reportData.totalCommissions.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.totalAppointments} agendamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissão Média</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {reportData.averageCommission.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por agendamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(reportData.professionalCommissions).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Com comissões no período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Comissões Mensais */}
          <Card>
            <CardHeader>
              <CardTitle>Comissões Mensais</CardTitle>
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
                      dataKey="commission"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
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

          {/* Gráfico de Comissões por Profissional */}
          <Card>
            <CardHeader>
              <CardTitle>Comissões por Profissional</CardTitle>
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

        {/* Gráfico de Barras - Top Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle>Top Profissionais por Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.pie.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                    formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Comissões']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
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
            <CardTitle>Detalhamento de Comissões</CardTitle>
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
                    <th className="text-right p-2">Valor Serviço</th>
                    <th className="text-right p-2">Comissão (15%)</th>
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
                      <td className="p-2 text-right font-medium text-blue-600">
                        R$ {((apt.servico_preco || 0) * 0.15).toFixed(2)}
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

export default RelatorioComissoes;
