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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">
              Análises e métricas do sistema
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>

            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 189.570</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{systemMetrics.growth}%</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salões Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.totalSalons}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+3</span> novos este mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> crescimento
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.churnRate}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-0.5%</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Receita</TabsTrigger>
            <TabsTrigger value="salons">Salões</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="usage">Uso do Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="mr-2 h-5 w-5" />
                    Evolução da Receita
                  </CardTitle>
                  <CardDescription>
                    Receita mensal recorrente (MRR)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-lg">
                    <p className="text-muted-foreground">Gráfico de linha da receita por mês</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Assinaturas por Mês
                  </CardTitle>
                  <CardDescription>
                    Número de novas assinaturas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border rounded-lg">
                    <p className="text-muted-foreground">Gráfico de barras das assinaturas</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Dados Detalhados</CardTitle>
                <CardDescription>
                  Breakdown da receita por período
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Salões por Performance</CardTitle>
                <CardDescription>
                  Salões com melhor desempenho em receita e agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ranking</TableHead>
                      <TableHead>Salão</TableHead>
                      <TableHead>Receita</TableHead>
                      <TableHead>Agendamentos</TableHead>
                      <TableHead>Crescimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSalons.map((salon, index) => (
                      <TableRow key={salon.name}>
                        <TableCell>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{salon.name}</TableCell>
                        <TableCell>R$ {salon.revenue.toLocaleString()}</TableCell>
                        <TableCell>{salon.appointments}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            +{salon.growth}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    Distribuição de Planos
                  </CardTitle>
                  <CardDescription>
                    Percentual de assinaturas por plano
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {planDistribution.map((plan) => (
                      <div key={plan.plan} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          <span>{plan.plan}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{plan.count} salões</span>
                          <Badge variant="outline">{plan.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversão de Planos</CardTitle>
                  <CardDescription>
                    Upgrades e downgrades de assinaturas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Upgrades este mês</span>
                      <Badge variant="default" className="bg-green-600">+5</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Downgrades este mês</span>
                      <Badge variant="destructive">-1</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Taxa de conversão</span>
                      <Badge variant="outline">16.7%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.totalAppointments}</div>
                  <p className="text-sm text-muted-foreground">Total no sistema</p>
                  <div className="mt-2">
                    <Badge variant="default" className="bg-green-600">+18% este mês</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {systemMetrics.averageTicket}</div>
                  <p className="text-sm text-muted-foreground">Por agendamento</p>
                  <div className="mt-2">
                    <Badge variant="default" className="bg-blue-600">+5.2% este mês</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tempo Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45min</div>
                  <p className="text-sm text-muted-foreground">Por sessão</p>
                  <div className="mt-2">
                    <Badge variant="outline">Estável</Badge>
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