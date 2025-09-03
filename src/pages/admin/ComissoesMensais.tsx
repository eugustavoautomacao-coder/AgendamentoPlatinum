import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  FileText,
  Download,
  Plus,
  CreditCard,
  Wallet,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ComissaoMensal {
  id: string;
  salao_id: string;
  funcionario_id: string;
  funcionario_nome: string;
  funcionario_avatar?: string;
  mes: number;
  ano: number;
  total_agendamentos: number;
  total_servicos: number;
  total_taxas: number;
  base_calculo_total: number;
  percentual_comissao: number;
  valor_comissao_total: number;
  valor_pago: number;
  saldo_pendente: number;
  status: 'aberto' | 'fechado' | 'pago';
  data_fechamento?: string;
  criado_em: string;
  atualizado_em: string;
}

interface PagamentoComissao {
  id: string;
  comissao_mensal_id: string;
  funcionario_nome: string;
  mes: number;
  ano: number;
  valor_pago: number;
  data_pagamento: string;
  forma_pagamento: string;
  observacoes?: string;
  usuario_pagamento?: string;
  criado_em: string;
}

interface DetalheAgendamento {
  id: string;
  appointment_id: string;
  valor_servico: number;
  taxa_custo: number;
  base_calculo: number;
  valor_comissao: number;
  criado_em: string;
}

export default function ComissoesMensais() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [comissoesMensais, setComissoesMensais] = useState<ComissaoMensal[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoComissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'aberto' | 'fechado' | 'pago'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedComissao, setSelectedComissao] = useState<ComissaoMensal | null>(null);
  const [detalhesAgendamentos, setDetalhesAgendamentos] = useState<DetalheAgendamento[]>([]);
  
  // Estados para modal de pagamento
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [valorPagamento, setValorPagamento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [observacoesPagamento, setObservacoesPagamento] = useState('');
  
  // Estados para modal de detalhes
  const [detalhesOpen, setDetalhesOpen] = useState(false);

  useEffect(() => {
    if (profile?.salao_id) {
      fetchComissoesMensais();
      fetchPagamentos();
    }
  }, [profile?.salao_id, filter, selectedPeriod]);

  const fetchComissoesMensais = async () => {
    if (!profile?.salao_id) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('vw_comissoes_mensais_resumo')
        .select('*')
        .eq('salao_id', profile.salao_id);
      
      // Filtrar por período
      if (selectedPeriod === 'current') {
        const currentDate = new Date();
        query = query
          .eq('mes', currentDate.getMonth() + 1)
          .eq('ano', currentDate.getFullYear());
      } else if (selectedPeriod === 'previous') {
        const previousDate = new Date();
        previousDate.setMonth(previousDate.getMonth() - 1);
        query = query
          .eq('mes', previousDate.getMonth() + 1)
          .eq('ano', previousDate.getFullYear());
      }
      
      const { data, error } = await query.order('funcionario_nome');
      
      if (error) throw error;
      
      setComissoesMensais(data || []);
    } catch (error) {
      console.error('Erro ao buscar comissões mensais:', error);
      toast.error('Erro ao carregar comissões mensais');
    } finally {
      setLoading(false);
    }
  };

  const fetchPagamentos = async () => {
    if (!profile?.salao_id) return;
    
    try {
      const { data, error } = await supabase
        .from('vw_pagamentos_comissoes_detalhado')
        .select('*')
        .eq('salao_id', profile.salao_id)
        .order('data_pagamento', { ascending: false });
      
      if (error) throw error;
      
      setPagamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
    }
  };

  const fetchDetalhesAgendamentos = async (comissaoMensalId: string) => {
    try {
      const { data, error } = await supabase
        .from('comissoes_agendamentos_detalhes')
        .select('*')
        .eq('comissao_mensal_id', comissaoMensalId)
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      
      setDetalhesAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast.error('Erro ao carregar detalhes dos agendamentos');
    }
  };

  const registrarPagamento = async () => {
    if (!selectedComissao || !valorPagamento) return;
    
    try {
      const valor = parseFloat(valorPagamento);
      if (valor <= 0) {
        toast.error('Valor deve ser maior que zero');
        return;
      }
      
      if (valor > selectedComissao.saldo_pendente) {
        toast.error('Valor não pode ser maior que o saldo pendente');
        return;
      }
      
      const { error } = await supabase.rpc('registrar_pagamento_comissao', {
        p_comissao_mensal_id: selectedComissao.id,
        p_valor_pago: valor,
        p_forma_pagamento: formaPagamento,
        p_observacoes: observacoesPagamento || null,
        p_usuario_id: profile?.id || null
      });

      if (error) throw error;
      
      toast.success('Pagamento registrado com sucesso!');
      setPagamentoOpen(false);
      setSelectedComissao(null);
      setValorPagamento('');
      setFormaPagamento('PIX');
      setObservacoesPagamento('');
      
      // Atualizar dados
      fetchComissoesMensais();
      fetchPagamentos();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  const fecharMes = async (mes: number, ano: number) => {
    if (!profile?.salao_id) return;
    
    // Verificar se há comissões com saldo pendente para este mês/ano
    const comissoesComSaldo = comissoesMensais.filter(
      comissao => comissao.mes === mes && 
                  comissao.ano === ano && 
                  comissao.saldo_pendente > 0
    );
    
    if (comissoesComSaldo.length > 0) {
      // Listar funcionários com saldo pendente
      const funcionariosPendentes = comissoesComSaldo
        .map(c => c.funcionario_nome)
        .join(', ');
      
      toast.error(
        `Não é possível fechar o mês com saldo pendente. ` +
        `Acertar com os funcionários: ${funcionariosPendentes}`,
        { duration: 8000 }
      );
      return;
    }
    
    try {
      const { error } = await supabase.rpc('fechar_mes_comissoes', {
        p_salao_id: profile.salao_id,
        p_mes: mes,
        p_ano: ano
      });

      if (error) throw error;
      
      toast.success('Mês fechado com sucesso!');
      fetchComissoesMensais();
    } catch (error) {
      console.error('Erro ao fechar mês:', error);
      toast.error('Erro ao fechar mês');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aberto: { label: 'Aberto', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
      fechado: { label: 'Fechado', variant: 'default' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' },
      pago: { label: 'Pago', variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.aberto;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMonthName = (mes: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[mes - 1] || '';
  };

  const filteredComissoes = comissoesMensais.filter(comissao => {
    const matchesFilter = filter === 'all' || comissao.status === filter;
    const matchesSearch = !searchTerm || 
      comissao.funcionario_nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getTotalValues = () => {
    const totals = {
      total_funcionarios: comissoesMensais.length,
      total_comissoes: comissoesMensais.reduce((sum, c) => sum + c.valor_comissao_total, 0),
      total_pago: comissoesMensais.reduce((sum, c) => sum + c.valor_pago, 0),
      total_pendente: comissoesMensais.reduce((sum, c) => sum + c.saldo_pendente, 0)
    };
    return totals;
  };

  const counts = {
    all: comissoesMensais.length,
    aberto: comissoesMensais.filter(c => c.status === 'aberto').length,
    fechado: comissoesMensais.filter(c => c.status === 'fechado').length,
    pago: comissoesMensais.filter(c => c.status === 'pago').length
  };

  const totals = getTotalValues();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Comissões Mensais</h1>
              <p className="text-muted-foreground">
                Gerencie comissões acumuladas mensalmente por profissional
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchComissoesMensais} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.total_funcionarios}</div>
              <p className="text-xs text-muted-foreground">
                Com comissões no período
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.total_comissoes)}</div>
              <p className="text-xs text-muted-foreground">
                Valor total gerado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.total_pago)}</div>
              <p className="text-xs text-muted-foreground">
                Valor já pago
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.total_pendente)}</div>
              <p className="text-xs text-muted-foreground">
                Valor a pagar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Mês Atual</SelectItem>
                    <SelectItem value="previous">Mês Anterior</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtros de Status */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'aberto', 'fechado', 'pago'] as const).map((filterType) => {
                  const count = counts[filterType];
                  const label = filterType === 'all' ? 'Todas' : filterType.charAt(0).toUpperCase() + filterType.slice(1);
                  
                  return (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterType)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-3 w-3" />
                      {label} ({count})
                    </Button>
                  );
                })}
              </div>
              
              {/* Contador de Resultados */}
              <div className="text-sm text-muted-foreground">
                {filteredComissoes.length} de {comissoesMensais.length} comissões mensais
                {searchTerm && ` • Buscando por "${searchTerm}"`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Comissões Mensais */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando comissões mensais...</p>
            </div>
          </div>
        ) : filteredComissoes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma comissão mensal encontrada</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Não há comissões mensais registradas ainda.'
                  : `Não há comissões com status "${filter}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredComissoes.map((comissao) => (
              <Card key={comissao.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        {comissao.funcionario_avatar ? (
                          <img
                            src={comissao.funcionario_avatar}
                            alt={comissao.funcionario_nome}
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {comissao.funcionario_nome}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getMonthName(comissao.mes)} {comissao.ano}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(comissao.status)}
                          {comissao.saldo_pendente > 0 && comissao.status === 'aberto' && (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Saldo Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          <Scissors className="h-4 w-4 text-primary" />
                          <span className="font-medium">{comissao.total_agendamentos} agendamentos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="font-medium">{formatCurrency(comissao.total_servicos)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium">{formatCurrency(comissao.total_taxas)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          <Receipt className="h-4 w-4 text-primary" />
                          <span className="font-medium">{comissao.percentual_comissao}%</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Resumo Financeiro */}
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm text-primary">Resumo Financeiro</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Base para Comissão:</span>
                              <p className="font-medium">{formatCurrency(comissao.base_calculo_total)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Comissão Total:</span>
                              <p className="font-medium text-primary">{formatCurrency(comissao.valor_comissao_total)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Valor Pago:</span>
                              <p className="font-medium text-green-600">{formatCurrency(comissao.valor_pago)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Saldo Pendente:</span>
                              <p className="font-medium text-orange-600">{formatCurrency(comissao.saldo_pendente)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 ml-4">
                      {comissao.status === 'aberto' && comissao.saldo_pendente > 0 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedComissao(comissao);
                            setPagamentoOpen(true);
                          }}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4" />
                          Registrar Pagamento
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedComissao(comissao);
                          fetchDetalhesAgendamentos(comissao.id);
                          setDetalhesOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Ver Detalhes
                      </Button>
                      
                      {comissao.status === 'aberto' && (
                        <Button
                          size="sm"
                          variant={comissao.saldo_pendente > 0 ? "destructive" : "outline"}
                          onClick={() => fecharMes(comissao.mes, comissao.ano)}
                          disabled={comissao.saldo_pendente > 0}
                          className="flex items-center gap-2"
                          title={
                            comissao.saldo_pendente > 0 
                              ? `Não é possível fechar o mês com saldo pendente de ${formatCurrency(comissao.saldo_pendente)}`
                              : "Fechar o mês"
                          }
                        >
                          <Calendar className="h-4 w-4" />
                          {comissao.saldo_pendente > 0 ? 'Mês com Saldo Pendente' : 'Fechar Mês'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Pagamento */}
        <Dialog open={pagamentoOpen} onOpenChange={setPagamentoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento de Comissão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedComissao && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo da Comissão</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Funcionário:</strong> {selectedComissao.funcionario_nome}</p>
                    <p><strong>Período:</strong> {getMonthName(selectedComissao.mes)} {selectedComissao.ano}</p>
                    <p><strong>Comissão Total:</strong> {formatCurrency(selectedComissao.valor_comissao_total)}</p>
                    <p><strong>Saldo Pendente:</strong> {formatCurrency(selectedComissao.saldo_pendente)}</p>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="valorPagamento">Valor do Pagamento</Label>
                <Input
                  id="valorPagamento"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedComissao?.saldo_pendente || 0}
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: {formatCurrency(selectedComissao?.saldo_pendente || 0)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações (Opcional)</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Ex: Pagamento parcial, referente aos primeiros 15 dias..."
                  value={observacoesPagamento}
                  onChange={(e) => setObservacoesPagamento(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={registrarPagamento} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Registrar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes */}
        <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes dos Agendamentos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedComissao && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo da Comissão</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Funcionário:</strong> {selectedComissao.funcionario_nome}</p>
                    <p><strong>Período:</strong> {getMonthName(selectedComissao.mes)} {selectedComissao.ano}</p>
                    <p><strong>Total de Agendamentos:</strong> {selectedComissao.total_agendamentos}</p>
                    <p><strong>Comissão Total:</strong> {formatCurrency(selectedComissao.valor_comissao_total)}</p>
                  </div>
                </div>
              )}
              
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {detalhesAgendamentos.map((detalhe) => (
                    <div key={detalhe.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Scissors className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Agendamento #{detalhe.appointment_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(detalhe.criado_em)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(detalhe.valor_comissao)}</p>
                        <p className="text-xs text-muted-foreground">
                          Base: {formatCurrency(detalhe.base_calculo)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  // Fechar modal e navegar para comissões individuais
                  setDetalhesOpen(false);
                  navigate(`/admin/comissoes?funcionario=${selectedComissao?.funcionario_id}&nome=${selectedComissao?.funcionario_nome}`);
                }}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Ver Comissões Individuais
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
