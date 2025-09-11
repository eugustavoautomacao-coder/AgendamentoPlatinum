import { useState } from "react";
import { Search, Plus, Crown, Check, X, TrendingUp, DollarSign, Calendar, Users, CreditCard } from "lucide-react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const Assinaturas = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for subscription plans
  const plans = [
    {
      id: "basic",
      name: "Básico",
      price: 29.90,
      features: ["Até 5 profissionais", "Agendamentos ilimitados", "Relatórios básicos", "Suporte por email"],
      popular: false,
      active: true
    },
    {
      id: "professional",
      name: "Profissional", 
      price: 59.90,
      features: ["Até 15 profissionais", "Agendamentos ilimitados", "Relatórios avançados", "Suporte prioritário", "App mobile"],
      popular: true,
      active: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99.90,
      features: ["Profissionais ilimitados", "Agendamentos ilimitados", "Relatórios personalizados", "Suporte 24/7", "App mobile", "API personalizada"],
      popular: false,
      active: true
    }
  ];

  // Mock data for active subscriptions
  const subscriptions = [
    {
      id: "1",
      salon: "Salão Bella Vista",
      plan: "Profissional",
      status: "active",
      price: 59.90,
      next_billing: "2025-02-10",
      created_at: "2024-11-10",
      professionals_count: 8,
      max_professionals: 15
    },
    {
      id: "2", 
      salon: "Estúdio Glamour",
      plan: "Básico",
      status: "active",
      price: 29.90,
      next_billing: "2025-02-15",
      created_at: "2024-12-15",
      professionals_count: 3,
      max_professionals: 5
    },
    {
      id: "3",
      salon: "Beauty Center",
      plan: "Enterprise", 
      status: "active",
      price: 99.90,
      next_billing: "2025-02-20",
      created_at: "2024-10-20",
      professionals_count: 25,
      max_professionals: -1 // unlimited
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">Ativo</Badge>;
      case "canceled":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.price, 0);
  const averageRevenue = totalRevenue / subscriptions.length;

  return (
    <SuperAdminLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6 w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Assinaturas</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Gerencie planos e assinaturas do sistema
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button className="text-xs sm:text-sm px-3 py-2">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Novo Plano</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">R$ {totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +15% comparado ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Assinaturas Ativas</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground">
                100% de retenção este mês
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">R$ {averageRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Por assinatura/mês
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Planos Ativos</CardTitle>
              <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{plans.filter(p => p.active).length}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para contratação
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subscriptions" className="space-y-4 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">Assinaturas Ativas</TabsTrigger>
            <TabsTrigger value="plans" className="text-xs sm:text-sm">Planos Disponíveis</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2 w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar assinaturas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-6 sm:pl-8 w-full text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Subscriptions Table */}
            <Card className="shadow-elegant w-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">Assinaturas Ativas</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      Lista de todas as assinaturas ativas no sistema
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 w-full">
                {/* Mobile View - Cards */}
                <div className="block md:hidden space-y-3">
                  {subscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="flex flex-col gap-3 p-3 sm:p-4 bg-card rounded-lg border border-border hover:shadow-soft transition-all duration-200 w-full min-w-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground text-sm sm:text-base truncate">{subscription.salon}</div>
                        {getStatusBadge(subscription.status)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{subscription.plan}</Badge>
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Uso:</span> {subscription.professionals_count}/{subscription.max_professionals === -1 ? '∞' : subscription.max_professionals} profissionais
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Próximo:</span> {new Date(subscription.next_billing).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Valor:</span> R$ {subscription.price.toFixed(2)}
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
                      <TableHead>Salão</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Próximo Pagamento</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">{subscription.salon}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscription.plan}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {subscription.professionals_count}/{subscription.max_professionals === -1 ? '∞' : subscription.max_professionals} profissionais
                            </div>
                            <Progress 
                              value={subscription.max_professionals === -1 ? 50 : (subscription.professionals_count / subscription.max_professionals) * 100} 
                              className="h-2" 
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(subscription.next_billing).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">
                          R$ {subscription.price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            {/* Plans Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative shadow-soft hover:shadow-elegant transition-all duration-200 ${plan.popular ? 'border-primary' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary">Mais Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                      <span className="truncate">{plan.name}</span>
                      {plan.popular && <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-xl sm:text-2xl lg:text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" className="flex-1 text-xs sm:text-sm">
                        Editar
                      </Button>
                      <Button 
                        variant={plan.active ? "destructive" : "default"} 
                        className="flex-1 text-xs sm:text-sm"
                      >
                        {plan.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default Assinaturas;