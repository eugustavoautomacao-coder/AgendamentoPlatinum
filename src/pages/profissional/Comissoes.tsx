import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useComissoes } from '@/hooks/useComissoes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calendar, TrendingUp, Download, Filter, RefreshCw, User, Scissors, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ProfissionalComissoes = () => {
  const { profile } = useAuth();
  const { 
    comissoesMensais, 
    detalhesComissao, 
    loading, 
    fetchComissoesMensais, 
    fetchDetalhesComissao 
  } = useComissoes(profile?.id);
  
  const [filtro, setFiltro] = useState<'todos' | 'aberto' | 'pago'>('todos');
  const [mesSelecionado, setMesSelecionado] = useState<string>('');
  const [anoSelecionado, setAnoSelecionado] = useState<string>('');


  // Filtrar comissões
  const comissoesFiltradas = comissoesMensais.filter(comissao => {
    const filtroStatus = filtro === 'todos' || comissao.status === filtro;
    const filtroMes = !mesSelecionado || mesSelecionado === 'todos' || comissao.mes.toString() === mesSelecionado;
    const filtroAno = !anoSelecionado || anoSelecionado === 'todos' || comissao.ano.toString() === anoSelecionado;
    
    return filtroStatus && filtroMes && filtroAno;
  });

  // Calcular estatísticas
  const totalComissoes = comissoesFiltradas.reduce((acc, comissao) => acc + comissao.valor_comissao_total, 0);
  const totalPago = comissoesFiltradas.reduce((acc, comissao) => acc + comissao.valor_pago, 0);
  const saldoPendente = comissoesFiltradas.reduce((acc, comissao) => acc + comissao.saldo_pendente, 0);
  const comissoesAbertas = comissoesFiltradas.filter(c => c.status === 'aberto').length;
  const comissoesPagas = comissoesFiltradas.filter(c => c.status === 'pago').length;

  // Gerar opções de mês e ano
  const meses = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const anos = Array.from(new Set(comissoesMensais.map(c => c.ano))).sort((a, b) => b - a);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'aberto':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getNomeMes = (mes: number) => {
    return meses.find(m => m.value === mes.toString())?.label || 'Mês';
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
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

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {saldoPendente.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {totalPago.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground">
              Comissões recebidas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Abertas</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{comissoesAbertas}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro por Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filtro === 'todos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltro('todos')}
                >
                  Todos
                </Button>
                <Button
                  variant={filtro === 'aberto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltro('aberto')}
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
              </div>
            </div>

            {/* Filtro por Mês */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os meses</SelectItem>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Ano */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botão de Refresh */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchComissoesMensais}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Comissões Mensais */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões Mensais</CardTitle>
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
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={comissao.funcionario_avatar} alt={comissao.funcionario_nome} />
                          <AvatarFallback className="bg-pink-100 text-pink-600">
                            {comissao.funcionario_nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-pink-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">
                          {getNomeMes(comissao.mes)} de {comissao.ano}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {comissao.total_agendamentos} agendamentos • {comissao.percentual_comissao}% de comissão
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-lg">
                        R$ {comissao.valor_comissao_total.toFixed(2).replace('.', ',')}
                      </div>
                      {getStatusBadge(comissao.status)}
                    </div>
                  </div>

                  {/* Detalhes da comissão */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total de Serviços:</span>
                      <span className="font-medium">R$ {comissao.total_servicos.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Valor Pago:</span>
                      <span className="font-medium text-green-600">R$ {comissao.valor_pago.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Saldo Pendente:</span>
                      <span className="font-medium text-yellow-600">R$ {comissao.saldo_pendente.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Botão para ver detalhes */}
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchDetalhesComissao(comissao.id)}
                      className="w-full"
                    >
                      <Scissors className="h-4 w-4 mr-2" />
                      Ver Detalhes dos Agendamentos
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {detalhesComissao.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Detalhes dos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detalhesComissao.map((detalhe) => (
                <div
                  key={detalhe.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{detalhe.cliente_nome}</h4>
                      <p className="text-sm text-muted-foreground">{detalhe.servico_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {detalhe.data_agendamento && format(new Date(detalhe.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      R$ {detalhe.valor_comissao.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((detalhe.valor_comissao / detalhe.valor_servico) * 100).toFixed(1)}% de R$ {detalhe.valor_servico.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfissionalComissoes;


