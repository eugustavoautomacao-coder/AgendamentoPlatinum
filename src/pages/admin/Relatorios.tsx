import { BarChart3, DollarSign, TrendingUp, Calendar, Download, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layout/AdminLayout";

const Relatorios = () => {
  const financialData = {
    receitaBruta: 8450.00,
    totalTaxas: 1265.50,
    receitaLiquida: 7184.50
  };

  const servicosRealizados = [
    { name: "Corte Feminino", quantity: 45, revenue: 2025.00 },
    { name: "Escova", quantity: 32, revenue: 1120.00 },
    { name: "Coloração", quantity: 18, revenue: 1530.00 },
    { name: "Manicure", quantity: 28, revenue: 700.00 },
    { name: "Barba", quantity: 25, revenue: 500.00 }
  ];

  const monthlyData = [
    { month: "Jan", revenue: 7200 },
    { month: "Fev", revenue: 7800 },
    { month: "Mar", revenue: 8450 },
    { month: "Abr", revenue: 9200 },
    { month: "Mai", revenue: 8900 }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise financeira e operacional do salão
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Bruta
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {financialData.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-success">
                +15% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Taxas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {financialData.totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {((financialData.totalTaxas / financialData.receitaBruta) * 100).toFixed(1)}% da receita bruta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Líquida
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {financialData.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-success">
                +18% vs mês anterior
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
                {servicosRealizados.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-4">
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evolução Mensal */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução Mensal
              </CardTitle>
              <CardDescription>
                Receita dos últimos 5 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month, index) => {
                  const previous = monthlyData[index - 1];
                  const growth = previous ? ((month.revenue - previous.revenue) / previous.revenue) * 100 : 0;
                  const isPositive = growth >= 0;
                  
                  return (
                    <div key={month.month} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium text-muted-foreground">
                        {month.month}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(month.revenue / Math.max(...monthlyData.map(m => m.revenue))) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          R$ {month.revenue.toLocaleString('pt-BR')}
                        </div>
                        {index > 0 && (
                          <div className={`text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
                            {isPositive ? '+' : ''}{growth.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relatório Detalhado */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Serviços Realizados - Março 2024
            </CardTitle>
            <CardDescription>
              Listagem detalhada dos serviços do período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "15/03/2024", client: "Maria Silva", service: "Corte + Escova", professional: "Ana Costa", value: 80.00 },
                { date: "15/03/2024", client: "João Santos", service: "Barba", professional: "Carlos Lima", value: 25.00 },
                { date: "14/03/2024", client: "Fernanda Oliveira", service: "Manicure", professional: "Lucia Santos", value: 30.00 },
                { date: "14/03/2024", client: "Ana Carolina", service: "Coloração", professional: "Ana Costa", value: 95.00 },
                { date: "13/03/2024", client: "Roberto Lima", service: "Corte Masculino", professional: "Carlos Lima", value: 35.00 }
              ].map((item, index) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Relatorios;