import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Comissao {
  id: string;
  salao_id: string;
  appointment_id: string;
  funcionario_id: string;
  servico_id: string;
  valor_servico: number;
  taxa_custo_tipo: string;
  taxa_custo_valor: number;
  valor_taxa_custo: number;
  base_calculo_comissao: number;
  percentual_comissao: number;
  valor_comissao: number;
  status: 'pendente' | 'paga' | 'cancelada';
  data_calculo: string;
  data_pagamento?: string;
  observacoes?: string;
  criado_em: string;
  // Campos relacionados
  funcionario_nome?: string;
  servico_nome?: string;
  cliente_nome?: string;
  data_agendamento?: string;
  // Referência para comissão mensal
  comissao_mensal_id?: string;
}

export default function Comissoes() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pendente' | 'paga' | 'cancelada'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedComissao, setSelectedComissao] = useState<Comissao | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [marcarPagaOpen, setMarcarPagaOpen] = useState(false);
  
  // Parâmetros da URL para filtrar por profissional
  const funcionarioId = searchParams.get('funcionario');
  const funcionarioNome = searchParams.get('nome');

  useEffect(() => {
    if (profile?.salao_id) {
      fetchComissoes();
    }
  }, [profile?.salao_id, filter, selectedPeriod, funcionarioId]);

  const fetchComissoes = async () => {
    if (!profile?.salao_id) return;
    
    try {
      setLoading(true);
      
      // Buscar comissões individuais através de comissoes_agendamentos_detalhes
      // que contém os detalhes de cada agendamento com comissão
      let query = supabase
        .from('comissoes_agendamentos_detalhes')
        .select(`
          *,
          comissoes_mensais(
            id,
            funcionario_id,
            salao_id,
            status,
            percentual_comissao,
            employees(
              id,
              nome,
              salao_id
            )
          ),
          appointments(
            id,
            cliente_nome,
            data_hora,
            status,
            servico_id,
            services(
              id,
              nome,
              preco
            )
          )
        `);
      
      // Filtrar por salão através da comissão mensal
      if (funcionarioId) {
        // Se há funcionário específico, buscar comissões mensais desse funcionário
        const { data: comissoesMensais, error: cmError } = await supabase
          .from('comissoes_mensais')
          .select('id')
          .eq('funcionario_id', funcionarioId)
          .eq('salao_id', profile.salao_id);
        
        if (cmError) {
          console.error('Erro ao buscar comissões mensais:', cmError);
        }
        
        if (comissoesMensais && comissoesMensais.length > 0) {
          const comissaoMensalIds = comissoesMensais.map(cm => cm.id);
          query = query.in('comissao_mensal_id', comissaoMensalIds);
        } else {
          // Se não há comissões mensais, retornar array vazio
          setComissoes([]);
          setLoading(false);
          return;
        }
      } else {
        // Buscar todas as comissões mensais do salão
        const { data: comissoesMensais, error: cmError } = await supabase
          .from('comissoes_mensais')
          .select('id')
          .eq('salao_id', profile.salao_id);
        
        if (cmError) {
          console.error('Erro ao buscar comissões mensais:', cmError);
        }
        
        if (comissoesMensais && comissoesMensais.length > 0) {
          const comissaoMensalIds = comissoesMensais.map(cm => cm.id);
          query = query.in('comissao_mensal_id', comissaoMensalIds);
        } else {
          // Se não há comissões mensais, retornar array vazio
          setComissoes([]);
          setLoading(false);
          return;
        }
      }
      
      // Filtrar por período baseado na data do agendamento
      if (selectedPeriod !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (selectedPeriod) {
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0); // Todas as datas
        }
        
        if (startDate) {
          // Filtrar por data do agendamento através de uma subquery
          // Primeiro buscar appointments no período
          const { data: appointmentsNoPeriodo, error: aptError } = await supabase
            .from('appointments')
            .select('id')
            .gte('data_hora', startDate.toISOString())
            .eq('salao_id', profile.salao_id);
          
          if (aptError) {
            console.error('Erro ao buscar appointments:', aptError);
          }
          
          if (appointmentsNoPeriodo && appointmentsNoPeriodo.length > 0) {
            const appointmentIds = appointmentsNoPeriodo.map(apt => apt.id);
            query = query.in('appointment_id', appointmentIds);
          } else {
            // Se não há appointments no período, retornar array vazio
            setComissoes([]);
            setLoading(false);
            return;
          }
        }
      }
      
      const { data, error } = await query.order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro na query de comissões:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        setComissoes([]);
        setLoading(false);
        return;
      }
      
      // Buscar pagamentos para determinar status das comissões
      const comissaoMensalIds = (data || [])
        .map((d: any) => d.comissoes_mensais?.id)
        .filter(Boolean) as string[];
      
      let pagamentos: any[] = [];
      if (comissaoMensalIds.length > 0) {
        const { data: pagamentosData, error: pagamentosError } = await supabase
          .from('pagamentos_comissoes')
          .select('comissao_mensal_id, valor_pago, data_pagamento')
          .in('comissao_mensal_id', comissaoMensalIds);
        
        if (pagamentosError) {
          console.error('Erro ao buscar pagamentos:', pagamentosError);
        }
        pagamentos = pagamentosData || [];
      }
      
      // Criar mapa de pagamentos por comissão mensal
      const pagamentosPorComissao = new Map();
      if (pagamentos.length > 0) {
        pagamentos.forEach((pagamento: any) => {
          if (!pagamentosPorComissao.has(pagamento.comissao_mensal_id)) {
            pagamentosPorComissao.set(pagamento.comissao_mensal_id, {
              total_pago: 0,
              data_pagamento: null
            });
          }
          const info = pagamentosPorComissao.get(pagamento.comissao_mensal_id);
          info.total_pago += parseFloat(pagamento.valor_pago) || 0;
          if (pagamento.data_pagamento && (!info.data_pagamento || pagamento.data_pagamento > info.data_pagamento)) {
            info.data_pagamento = pagamento.data_pagamento;
          }
        });
      }
      
      // Transformar os dados para o formato esperado da interface Comissao
      const transformedData = (data || []).map((detalhe: any) => {
        const comissaoMensal = detalhe.comissoes_mensais;
        const appointment = detalhe.appointments;
        const service = appointment?.services;
        const employee = comissaoMensal?.employees;
        
        // Determinar status baseado na comissão mensal e pagamentos
        let status: 'pendente' | 'paga' | 'cancelada' = 'pendente';
        let data_pagamento: string | undefined = undefined;
        
        if (appointment?.status === 'cancelado') {
          status = 'cancelada';
        } else if (comissaoMensal?.status === 'pago') {
          status = 'paga';
          const pagamentoInfo = pagamentosPorComissao.get(comissaoMensal.id);
          if (pagamentoInfo?.data_pagamento) {
            data_pagamento = pagamentoInfo.data_pagamento;
          }
        } else if (comissaoMensal?.status === 'fechado' || comissaoMensal?.status === 'pago') {
          status = 'paga';
        }
        
        return {
          id: detalhe.id,
          salao_id: comissaoMensal?.salao_id || profile.salao_id,
          appointment_id: detalhe.appointment_id,
          funcionario_id: comissaoMensal?.funcionario_id || '',
          servico_id: appointment?.servico_id || service?.id || '',
          valor_servico: detalhe.valor_servico || 0,
          taxa_custo_tipo: 'fixo', // Valor padrão, pode ser ajustado
          taxa_custo_valor: detalhe.taxa_custo || 0,
          valor_taxa_custo: detalhe.taxa_custo || 0,
          base_calculo_comissao: detalhe.base_calculo || 0,
          percentual_comissao: comissaoMensal?.percentual_comissao || 0,
          valor_comissao: detalhe.valor_comissao || 0,
          status: status,
          data_calculo: detalhe.criado_em || new Date().toISOString(),
          data_pagamento: data_pagamento,
          observacoes: undefined,
          criado_em: detalhe.criado_em || new Date().toISOString(),
          // Campos relacionados
          funcionario_nome: employee?.nome || 'Funcionário não encontrado',
          servico_nome: service?.nome || 'Serviço não encontrado',
          cliente_nome: appointment?.cliente_nome || 'Cliente não informado',
          data_agendamento: appointment?.data_hora || null,
          // Guardar referências para uso posterior
          comissao_mensal_id: comissaoMensal?.id
        };
      });
      
      setComissoes(transformedData);
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  };

  const marcarComissaoPaga = async () => {
    if (!selectedComissao || !selectedComissao.comissao_mensal_id) {
      toast.error('Comissão mensal não encontrada');
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.rpc('registrar_pagamento_comissao', {
        p_comissao_mensal_id: selectedComissao.comissao_mensal_id,
        p_valor_pago: selectedComissao.valor_comissao,
        p_forma_pagamento: 'Manual',
        p_observacoes: observacoes || `Pagamento individual da comissão do agendamento ${selectedComissao.appointment_id}`,
        p_usuario_id: session?.user?.id || null
      });

      if (error) throw error;
      
      toast.success('Comissão marcada como paga!');
      setMarcarPagaOpen(false);
      setSelectedComissao(null);
      setObservacoes('');
      fetchComissoes();
    } catch (error: any) {
      console.error('Erro ao marcar comissão como paga:', error);
      toast.error(error?.message || 'Erro ao marcar comissão como paga');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: 'Pendente', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      paga: { label: 'Paga', variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' },
      cancelada: { label: 'Cancelada', variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    // Verificar se o valor é válido
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const filteredComissoes = comissoes.filter(comissao => {
    const matchesFilter = filter === 'all' || comissao.status === filter;
    const matchesSearch = !searchTerm || 
      comissao.funcionario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comissao.servico_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comissao.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusCounts = () => {
    const counts = {
      all: comissoes.length,
      pendente: comissoes.filter(c => c.status === 'pendente').length,
      paga: comissoes.filter(c => c.status === 'paga').length,
      cancelada: comissoes.filter(c => c.status === 'cancelada').length
    };
    return counts;
  };

  const getTotalValues = () => {
    const totals = {
      total_servicos: comissoes.reduce((sum, c) => sum + c.valor_servico, 0),
      total_taxas: comissoes.reduce((sum, c) => sum + c.valor_taxa_custo, 0),
      total_comissoes: comissoes.reduce((sum, c) => sum + c.valor_comissao, 0),
      total_pendente: comissoes.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor_comissao, 0),
      total_pago: comissoes.filter(c => c.status === 'paga').reduce((sum, c) => sum + c.valor_comissao, 0)
    };
    return totals;
  };

  const counts = getStatusCounts();
  const totals = getTotalValues();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {funcionarioNome ? `Comissões - ${funcionarioNome}` : 'Comissões'}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {funcionarioNome 
                  ? `Comissões individuais do profissional ${funcionarioNome}`
                  : 'Gerencie o sistema de comissões dos profissionais'
                }
              </p>
              {funcionarioNome && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    Filtrado por Profissional
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {funcionarioNome && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/comissoes-mensais')}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar Para Todas as Comissões</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
            )}
            <Button onClick={fetchComissoes} disabled={loading} className="flex items-center gap-2 w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Serviços</CardTitle>
              <Scissors className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.total_servicos)}</div>
              <p className="text-xs text-muted-foreground">
                {comissoes.length} serviços realizados
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Taxas</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.total_taxas)}</div>
              <p className="text-xs text-muted-foreground">
                Custos deduzidos
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Comissões</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.total_comissoes)}</div>
              <p className="text-xs text-muted-foreground">
                Valor total a pagar
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.total_pendente)}</div>
              <p className="text-xs text-muted-foreground">
                {counts.pendente} comissões pendentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por funcionário, serviço ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="quarter">Último trimestre</SelectItem>
                    <SelectItem value="year">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtros de Status */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pendente', 'paga', 'cancelada'] as const).map((filterType) => {
                  const count = counts[filterType];
                  const label = filterType === 'all' ? 'Todas' : filterType.charAt(0).toUpperCase() + filterType.slice(1);
                  
                  return (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterType)}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Filter className="h-3 w-3" />
                      <span className="hidden sm:inline">{label} ({count})</span>
                      <span className="sm:hidden">{label}</span>
                    </Button>
                  );
                })}
              </div>
              
              {/* Contador de Resultados */}
              <div className="text-xs sm:text-sm text-muted-foreground">
                {filteredComissoes.length} de {comissoes.length} comissões
                {searchTerm && ` • Buscando por "${searchTerm}"`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Comissões */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando comissões...</p>
            </div>
          </div>
        ) : filteredComissoes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma comissão encontrada</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Não há comissões registradas ainda.'
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
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-foreground">
                              {comissao.funcionario_nome || 'Funcionário não encontrado'}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {formatDateTime(comissao.data_calculo)}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-start sm:justify-end">
                          {getStatusBadge(comissao.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 p-2 sm:p-3 rounded-lg">
                          <Scissors className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="font-medium truncate">{comissao.servico_nome || 'Serviço não encontrado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 p-2 sm:p-3 rounded-lg">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="font-medium">
                            {comissao.data_agendamento ? formatDate(comissao.data_agendamento) : 'Data não informada'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 p-2 sm:p-3 rounded-lg">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="font-medium truncate">{comissao.cliente_nome || 'Cliente não informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 p-2 sm:p-3 rounded-lg">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="font-medium">{formatCurrency(comissao.valor_comissao)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Detalhes do Cálculo */}
                        <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            <span className="font-medium text-xs sm:text-sm text-primary">Detalhes do Cálculo</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <span className="text-muted-foreground">Valor do Serviço:</span>
                              <p className="font-medium">{formatCurrency(comissao.valor_servico)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Taxa de Custo:</span>
                              <p className="font-medium">
                                {comissao.taxa_custo_tipo === 'percentual' 
                                  ? `${comissao.taxa_custo_valor || 0}%` 
                                  : formatCurrency(comissao.taxa_custo_valor || 0)
                                }
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({formatCurrency(comissao.valor_taxa_custo || 0)})
                                </span>
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Base para Comissão:</span>
                              <p className="font-medium">{formatCurrency(comissao.base_calculo_comissao)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Comissão ({comissao.percentual_comissao}%):</span>
                              <p className="font-medium text-primary">{formatCurrency(comissao.valor_comissao)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Observações */}
                        {comissao.observacoes && (
                          <div className="bg-muted/30 p-3 sm:p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                              <span className="font-medium text-xs sm:text-sm text-muted-foreground">Observações</span>
                            </div>
                            <p className="text-xs sm:text-sm text-foreground">{comissao.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 lg:ml-4">
                      {comissao.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedComissao(comissao);
                            setMarcarPagaOpen(true);
                          }}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full lg:w-auto"
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Marcar como Paga</span>
                        </Button>
                      )}
                      
                      {comissao.status === 'paga' && comissao.data_pagamento && (
                        <div className="text-xs sm:text-sm text-muted-foreground text-center">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mx-auto mb-1" />
                          Paga em {formatDate(comissao.data_pagamento)}
                        </div>
                      )}
                      

                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal para Marcar como Paga */}
        <Dialog open={marcarPagaOpen} onOpenChange={setMarcarPagaOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Marcar Comissão como Paga</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observacoes" className="text-sm sm:text-base">Observações (Opcional)</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Ex: Pago via PIX, transferência bancária..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  className="text-sm sm:text-base"
                />
              </div>
              
              {selectedComissao && (
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Resumo da Comissão</h4>
                  <div className="text-xs sm:text-sm space-y-1">
                    <p><strong>Funcionário:</strong> {selectedComissao.funcionario_nome}</p>
                    <p><strong>Serviço:</strong> {selectedComissao.servico_nome}</p>
                    <p><strong>Valor da Comissão:</strong> {formatCurrency(selectedComissao.valor_comissao)}</p>
                    <p><strong>Data do Cálculo:</strong> {formatDate(selectedComissao.data_calculo)}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </DialogClose>
              <Button onClick={marcarComissaoPaga} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
