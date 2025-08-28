import { useState } from "react";
import { Search, Plus, Crown, Check, X, TrendingUp, DollarSign, Calendar, Users } from "lucide-react";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
            <p className="text-muted-foreground">
              Gerencie planos e assinaturas do sistema
            </p>
          </div>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +15% comparado ao mês anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground">
                100% de retenção este mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {averageRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Por assinatura/mês
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.filter(p => p.active).length}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para contratação
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscriptions">Assinaturas Ativas</TabsTrigger>
            <TabsTrigger value="plans">Planos Disponíveis</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar assinaturas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Subscriptions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Assinaturas Ativas</CardTitle>
                <CardDescription>
                  Lista de todas as assinaturas ativas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            {/* Plans Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary">Mais Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {plan.popular && <Crown className="h-5 w-5 text-primary" />}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">
                        Editar
                      </Button>
                      <Button 
                        variant={plan.active ? "destructive" : "default"} 
                        className="flex-1"
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