import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Calendar, TrendingUp, Download, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comissao {
  id: string;
  data: string;
  cliente_nome: string;
  servico_nome: string;
  valor_servico: number;
  percentual_comissao: number;
  valor_comissao: number;
  status: 'pendente' | 'pago' | 'cancelado';
}

const ProfissionalComissoes = () => {
  const { profile } = useAuth();
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'pago' | 'cancelado'>('todos');

  // Dados mockados para demonstração
  const mockComissoes: Comissao[] = [
    {
      id: '1',
      data: '2024-01-15',
      cliente_nome: 'Maria Silva',
      servico_nome: 'Corte e Escova',
      valor_servico: 80.00,
      percentual_comissao: 30,
      valor_comissao: 24.00,
      status: 'pago'
    },
    {
      id: '2',
      data: '2024-01-16',
      cliente_nome: 'Ana Costa',
      servico_nome: 'Coloração',
      valor_servico: 120.00,
      percentual_comissao: 30,
      valor_comissao: 36.00,
      status: 'pendente'
    },
    {
      id: '3',
      data: '2024-01-17',
      cliente_nome: 'Joana Santos',
      servico_nome: 'Manicure',
      valor_servico: 50.00,
      percentual_comissao: 30,
      valor_comissao: 15.00,
      status: 'pago'
    }
  ];

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setComissoes(mockComissoes);
      setLoading(false);
    }, 1000);
  }, []);

  const comissoesFiltradas = comissoes.filter(comissao => 
    filtro === 'todos' || comissao.status === filtro
  );

  const totalComissoes = comissoesFiltradas.reduce((acc, comissao) => acc + comissao.valor_comissao, 0);
  const comissoesPendentes = comissoesFiltradas.filter(c => c.status === 'pendente').length;
  const comissoesPagas = comissoesFiltradas.filter(c => c.status === 'pago').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Minhas Comissões</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Acompanhe suas comissões e pagamentos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalComissoes.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground">
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{comissoesPendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{comissoesPagas}</div>
            <p className="text-xs text-muted-foreground">
              Comissões recebidas
            </p>
          </CardContent>
        </Card>
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filtro === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filtro === 'pendente' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('pendente')}
            >
              Pendentes
            </Button>
            <Button
              variant={filtro === 'pago' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('pago')}
            >
              Pagas
            </Button>
            <Button
              variant={filtro === 'cancelado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('cancelado')}
            >
              Canceladas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {comissoesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma comissão encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comissoesFiltradas.map((comissao) => (
                <div
                  key={comissao.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{comissao.cliente_nome}</h3>
                      <p className="text-sm text-muted-foreground">{comissao.servico_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comissao.data), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      R$ {comissao.valor_comissao.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {comissao.percentual_comissao}% de R$ {comissao.valor_servico.toFixed(2).replace('.', ',')}
                    </div>
                    {getStatusBadge(comissao.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfissionalComissoes;

