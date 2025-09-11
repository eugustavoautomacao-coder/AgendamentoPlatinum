import { Building2, Users, CreditCard, TrendingUp, Plus, Eye, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { useSalons } from "@/hooks/useSalons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const SuperAdminDashboard = () => {
  const { salons, loading } = useSalons();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .neq('tipo', 'system_admin');

        // Get total appointments
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true });

        setTotalUsers(usersCount || 0);
        setTotalAppointments(appointmentsCount || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      title: "Total de Salões",
      value: salons.length.toString(),
      icon: Building2,
      description: "Salões cadastrados",
      trend: "up"
    },
    {
      title: "Total de Usuários",
      value: totalUsers.toString(),
      icon: Users,
      description: "Usuários ativos",
      trend: "up"
    },
    {
      title: "Agendamentos",
      value: totalAppointments.toString(),
      icon: CreditCard,
      description: "Total realizados",
      trend: "up"
    },
    {
      title: "Taxa de Crescimento",
      value: "12%",
      icon: TrendingUp,
      description: "Crescimento mensal",
      trend: "up"
    }
  ];

  const recentSalons = salons.slice(0, 5);

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard SuperAdmin</h1>
              <p className="text-muted-foreground">
                Visão geral da plataforma
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/superadmin/saloes?create=true">
                <Plus className="h-4 w-4 mr-2" />
                Novo Salão
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-soft hover:shadow-elegant transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Salons */}
          <div className="lg:col-span-2">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Salões Recentes
                    </CardTitle>
                    <CardDescription>
                      {recentSalons.length} salões cadastrados recentemente
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/superadmin/saloes">
                      Ver Todos
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSalons.map((salon) => (
                    <div
                      key={salon.id}
                      className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {salon.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {salon.email} • Criado em {format(new Date(salon.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        Ativo
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/superadmin/saloes">
                    <Building2 className="h-4 w-4 mr-2" />
                    Gerenciar Salões
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/superadmin/usuarios">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Usuários
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/superadmin/assinaturas">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Assinaturas
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-success" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <Badge variant="default" className="bg-success text-success-foreground">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API</span>
                  <Badge variant="default" className="bg-success text-success-foreground">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pagamentos</span>
                  <Badge variant="secondary">Aguardando</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;