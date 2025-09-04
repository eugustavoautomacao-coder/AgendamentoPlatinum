import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  Scissors, 
  Clock,
  TrendingDown,
  Activity,
  PieChart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";

const Relatorios = () => {
  const navigate = useNavigate();

  const reports = [
    {
      id: 'faturamento',
      title: 'Faturamento',
      description: 'Análise completa de receita e performance financeira',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      priority: 'Alta',
      route: '/admin/relatorios/faturamento'
    },
    {
      id: 'comissoes',
      title: 'Comissões',
      description: 'Análise de comissões por profissional e período',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      priority: 'Alta',
      route: '/admin/relatorios/comissoes'
    },
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Análise de clientes, fidelização e segmentação',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      priority: 'Média',
      route: '/admin/relatorios/clientes'
    },
    {
      id: 'servicos',
      title: 'Serviços',
      description: 'Análise de performance e rentabilidade dos serviços',
      icon: Scissors,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      priority: 'Média',
      route: '/admin/relatorios/servicos'
    },
    {
      id: 'agendamentos',
      title: 'Agendamentos',
      description: 'Análise de ocupação e distribuição da agenda',
      icon: Calendar,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      priority: 'Média',
      route: '/admin/relatorios/agendamentos'
    },
    {
      id: 'funcionarios',
      title: 'Funcionários',
      description: 'Análise de performance e produtividade dos profissionais',
      icon: TrendingDown,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50',
      priority: 'Média',
      route: '/admin/relatorios/funcionarios'
    },
    {
      id: 'horarios',
      title: 'Horários',
      description: 'Análise de distribuição e ocupação dos horários',
      icon: Clock,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
      priority: 'Baixa',
      route: '/admin/relatorios/horarios'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-800';
      case 'Média':
        return 'bg-yellow-100 text-yellow-800';
      case 'Baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Acesse análises detalhadas e insights do seu negócio
            </p>
          </div>
        </div>

        {/* Grid de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const IconComponent = report.icon;
            return (
              <Card 
                key={report.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20"
                onClick={() => navigate(report.route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <Badge className={getPriorityColor(report.priority)}>
                      {report.priority}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-2">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {report.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <PieChart className="h-4 w-4 mr-2" />
                    Clique para acessar
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>


      </div>
    </AdminLayout>
  );
};

export default Relatorios;