import { useState } from "react";
import { Download, Calendar, TrendingUp, DollarSign, Users, BarChart3, PieChart, LineChart } from "lucide-react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Relatorios = () => {
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [period, setPeriod] = useState("month");

  // Mock data for reports
  const revenueData = [
    { month: "Jan", revenue: 12450, subscriptions: 15 },
    { month: "Fev", revenue: 14230, subscriptions: 18 },
    { month: "Mar", revenue: 16780, subscriptions: 22 },
    { month: "Abr", revenue: 18920, subscriptions: 25 },
    { month: "Mai", revenue: 21150, subscriptions: 28 },
    { month: "Jun", revenue: 19870, subscriptions: 27 }
  ];

  const topSalons = [
    { name: "Salão Bella Vista", revenue: 5670, appointments: 234, growth: 15.2 },
    { name: "Estúdio Glamour", revenue: 4320, appointments: 189, growth: 12.8 },
    { name: "Beauty Center", revenue: 6890, appointments: 298, growth: 18.5 },
    { name: "Espaço Vida", revenue: 3450, appointments: 145, growth: 8.3 },
    { name: "Salão Excellence", revenue: 4980, appointments: 212, growth: 14.1 }
  ];

  const planDistribution = [
    { plan: "Básico", count: 12, percentage: 40 },
    { plan: "Profissional", count: 15, percentage: 50 },
    { plan: "Enterprise", count: 3, percentage: 10 }
  ];

  const systemMetrics = {
    totalUsers: 1247,
    totalSalons: 30,
    totalAppointments: 8934,
    averageTicket: 67.50,
    churnRate: 2.3,
    growth: 15.8
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6 w-full max-w-full overflow-x-hidden min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Relatórios</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Análises e métricas do sistema
            </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>

            <Button className="text-xs sm:text-sm px-3 py-2">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">R$ 189.570</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{systemMetrics.growth}%</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Salões Ativos</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{systemMetrics.totalSalons}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+3</span> novos este mês
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{systemMetrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> crescimento
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Taxa de Churn</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{systemMetrics.churnRate}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-0.5%</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4 w-full max-w-full overflow-x-hidden">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 h-auto min-w-0">
            <TabsTrigger value="revenue" className="text-xs sm:text-sm">Receita</TabsTrigger>
            <TabsTrigger value="salons" className="text-xs sm:text-sm">Salões</TabsTrigger>
            <TabsTrigger value="plans" className="text-xs sm:text-sm">Planos</TabsTrigger>
            <TabsTrigger value="usage" className="text-xs sm:text-sm">Uso do Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4 w-full max-w-full overflow-x-hidden">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
              <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <LineChart className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Evolução da Receita</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Receita mensal recorrente (MRR)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="h-[200px] sm:h-[300px] flex items-center justify-center border rounded-lg">
                    <p className="text-muted-foreground text-xs sm:text-sm text-center">Gráfico de linha da receita por mês</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Assinaturas por Mês</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Número de novas assinaturas
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="h-[200px] sm:h-[300px] flex items-center justify-center border rounded-lg">
                    <p className="text-muted-foreground text-xs sm:text-sm text-center">Gráfico de barras das assinaturas</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-elegant w-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">Dados Detalhados</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                  Breakdown da receita por período
                </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 w-full">
                {/* Mobile View - Cards */}
                <div className="block md:hidden space-y-3">
                  {revenueData.map((item, index) => (
                    <div
                      key={item.month}
                      className="flex flex-col gap-2 p-3 sm:p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200 w-full min-w-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground text-sm sm:text-base">{item.month}</div>
                        {index > 0 && (
                          <Badge variant="outline" className="text-green-600 text-xs">
                            +{(((item.revenue - revenueData[index-1].revenue) / revenueData[index-1].revenue) * 100).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <div className="truncate">
                          <span className="font-medium">Receita:</span> R$ {item.revenue.toLocaleString()}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Assinaturas:</span> {item.subscriptions}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Receita</TableHead>
                      <TableHead>Assinaturas</TableHead>
                      <TableHead>Crescimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueData.map((item, index) => (
                      <TableRow key={item.month}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell>R$ {item.revenue.toLocaleString()}</TableCell>
                        <TableCell>{item.subscriptions}</TableCell>
                        <TableCell>
                          {index > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              +{(((item.revenue - revenueData[index-1].revenue) / revenueData[index-1].revenue) * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salons" className="space-y-4 w-full max-w-full overflow-x-hidden">
            <Card className="shadow-elegant w-full max-w-full overflow-x-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full min-w-0">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">Top Salões por Performance</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                  Salões com melhor desempenho em receita e agendamentos
                </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 w-full max-w-full overflow-x-hidden min-w-0">
                {/* Mobile View - Cards */}
                <div className="block lg:hidden space-y-3 w-full max-w-full overflow-x-hidden">
                  {topSalons.map((salon, index) => (
                    <div
                      key={salon.name}
                      className="flex flex-col gap-2 p-3 sm:p-4 bg-card rounded-lg border border-border hover:shadow-soft transition-all duration-200 w-full min-w-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground text-sm sm:text-base truncate">{salon.name}</div>
                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <div className="truncate">
                          <span className="font-medium">Receita:</span> R$ {salon.revenue.toLocaleString()}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Agendamentos:</span> {salon.appointments}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Crescimento:</span>
                          <Badge variant="default" className="bg-green-600 text-xs">
                            +{salon.growth}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden lg:block w-full max-w-full overflow-x-hidden">
                  <div className="overflow-x-auto w-full">
                    <Table className="w-full min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                          <TableHead className="text-xs sm:text-sm w-20">Ranking</TableHead>
                          <TableHead className="text-xs sm:text-sm w-40">Salão</TableHead>
                          <TableHead className="text-xs sm:text-sm w-32">Receita</TableHead>
                          <TableHead className="text-xs sm:text-sm w-32">Agendamentos</TableHead>
                          <TableHead className="text-xs sm:text-sm w-32">Crescimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSalons.map((salon, index) => (
                      <TableRow key={salon.name}>
                            <TableCell className="text-xs sm:text-sm">
                              <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                        </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm truncate">{salon.name}</TableCell>
                            <TableCell className="text-xs sm:text-sm">R$ {salon.revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{salon.appointments}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <Badge variant="default" className="bg-green-600 text-xs">
                            +{salon.growth}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4 w-full max-w-full overflow-x-hidden">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
              <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <PieChart className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Distribuição de Planos</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Percentual de assinaturas por plano
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {planDistribution.map((plan) => (
                      <div key={plan.plan} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm truncate">{plan.plan}</span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-xs sm:text-sm text-muted-foreground">{plan.count} salões</span>
                          <Badge variant="outline" className="text-xs">{plan.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Conversão de Planos</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Upgrades e downgrades de assinaturas
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Upgrades este mês</span>
                      <Badge variant="default" className="bg-green-600 text-xs">+5</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Downgrades este mês</span>
                      <Badge variant="destructive" className="text-xs">-1</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm">Taxa de conversão</span>
                      <Badge variant="outline" className="text-xs">16.7%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4 w-full max-w-full overflow-x-hidden">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
              <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg">Agendamentos</CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{systemMetrics.totalAppointments}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total no sistema</p>
                  <div className="mt-2">
                    <Badge variant="default" className="bg-green-600 text-xs">+18% este mês</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">R$ {systemMetrics.averageTicket}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Por agendamento</p>
                  <div className="mt-2">
                    <Badge variant="default" className="bg-blue-600 text-xs">+5.2% este mês</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg">Tempo Médio</CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">45min</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Por sessão</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">Estável</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default Relatorios;