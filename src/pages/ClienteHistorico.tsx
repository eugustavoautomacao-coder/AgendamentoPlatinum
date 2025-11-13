import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClienteAuth } from '@/hooks/useClienteAuth';
import { useClienteAgendamentos, ClienteAgendamento } from '@/hooks/useClienteAgendamentos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  User, 
  Phone, 
  MessageSquare, 
  ArrowLeft,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CalendarDays,
  DollarSign,
  Timer
} from 'lucide-react';


export const ClienteHistorico: React.FC = () => {
  const { salaoId } = useParams<{ salaoId: string }>();
  const navigate = useNavigate();
  const { cliente, isAuthenticated } = useClienteAuth();
  const { 
    agendamentos, 
    loading, 
    loadAgendamentos,
    getContadores,
    lastUpdate,
    refreshData
  } = useClienteAgendamentos();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todos');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated && cliente && salaoId) {
      loadAgendamentos(cliente.email, salaoId);
    }
  }, [isAuthenticated, cliente, salaoId, loadAgendamentos]);

  const handleRefresh = async () => {
    if (!cliente || !salaoId) return;
    
    setRefreshing(true);
    try {
      await refreshData(cliente.email, salaoId);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const formatarDataHora = (dataHora: string) => {
    const data = new Date(dataHora);
    return {
      data: data.toLocaleDateString('pt-BR'),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dataCompleta: data.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      dataCurta: data.toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: 'Pendente', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' },
      aprovado: { label: 'Aprovado', variant: 'secondary', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' },
      rejeitado: { label: 'Rejeitado', variant: 'secondary', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' },
      cancelado: { label: 'Cancelado', variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200' },
      confirmado: { label: 'Confirmado', variant: 'secondary', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;

    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'aprovado': return <CheckCircle className="h-4 w-4" />;
      case 'rejeitado': return <XCircle className="h-4 w-4" />;
      case 'cancelado': return <AlertCircle className="h-4 w-4" />;
      case 'confirmado': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Filtrar agendamentos baseado nos filtros
  const getFilteredAgendamentos = () => {
    let filtered = agendamentos;

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(ag => ag.status === statusFilter);
    }

    // Filtro por data
    if (dateFilter !== 'todos') {
      const hoje = new Date();
      const inicioSemana = new Date(hoje.getTime() - (hoje.getDay() * 24 * 60 * 60 * 1000));
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioAno = new Date(hoje.getFullYear(), 0, 1);

      filtered = filtered.filter(ag => {
        const dataAgendamento = new Date(ag.data_hora);
        switch (dateFilter) {
          case 'semana': return dataAgendamento >= inicioSemana;
          case 'mes': return dataAgendamento >= inicioMes;
          case 'ano': return dataAgendamento >= inicioAno;
          default: return true;
        }
      });
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ag => 
        ag.servico.nome.toLowerCase().includes(term) ||
        ag.funcionario.nome.toLowerCase().includes(term) ||
        ag.observacoes?.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  };

  const filteredAgendamentos = getFilteredAgendamentos();
  const contadores = getContadores();

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Histórico de Agendamentos</h1>
                <p className="text-muted-foreground">Olá, {cliente.nome}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate(`/cliente/${salaoId}/agendamentos`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>

          {/* Informação de última atualização */}
          <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            {refreshing && <span className="text-primary">• Atualizando...</span>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{contadores.pendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Aprovados</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{contadores.aprovados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Rejeitados</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{contadores.rejeitados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Geral</p>
                  <p className="text-2xl font-bold text-primary">{contadores.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Serviço, profissional ou observações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovado">Aprovados</SelectItem>
                    <SelectItem value="rejeitado">Rejeitados</SelectItem>
                    <SelectItem value="cancelado">Cancelados</SelectItem>
                    <SelectItem value="confirmado">Confirmados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todo o Período</SelectItem>
                    <SelectItem value="semana">Última Semana</SelectItem>
                    <SelectItem value="mes">Último Mês</SelectItem>
                    <SelectItem value="ano">Último Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando histórico...</p>
              </div>
            </div>
          ) : filteredAgendamentos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || statusFilter !== 'todos' || dateFilter !== 'todos'
                    ? 'Tente ajustar os filtros ou a busca.'
                    : 'Você ainda não possui agendamentos no histórico.'
                  }
                </p>
                {(searchTerm || statusFilter !== 'todos' || dateFilter !== 'todos') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('todos');
                      setDateFilter('todos');
                    }}
                    className="mx-auto"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {filteredAgendamentos.length} agendamento{filteredAgendamentos.length !== 1 ? 's' : ''} encontrado{filteredAgendamentos.length !== 1 ? 's' : ''}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('todos');
                    setDateFilter('todos');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
              
              {filteredAgendamentos.map((agendamento) => (
                <Card 
                  key={agendamento.id} 
                  className={`border-l-4 border-l-primary transition-all duration-300 cursor-pointer hover:shadow-lg ${
                    expandedCards.has(agendamento.id) ? 'ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => toggleCardExpansion(agendamento.id)}
                >
                  {/* Card Compacto */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {getStatusIcon(agendamento.status)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{agendamento.servico.nome}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatarDataHora(agendamento.data_hora).dataCurta}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatarDataHora(agendamento.data_hora).hora}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(agendamento.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8"
                        >
                          {expandedCards.has(agendamento.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Detalhes Expandidos */}
                  {expandedCards.has(agendamento.id) && (
                    <CardContent className="pt-0 border-t border-border">
                      <div className="space-y-4">
                        {/* Informações Principais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-medium">Profissional: {agendamento.funcionario.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-medium">Preço: R$ {agendamento.servico.preco.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Timer className="h-4 w-4 text-primary" />
                            <span className="font-medium">Duração: {agendamento.servico.duracao_minutos} min</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-primary" />
                            <span className="font-medium">Telefone: {agendamento.cliente_telefone}</span>
                          </div>
                        </div>

                        {/* Descrição do Serviço */}
                        {agendamento.servico.descricao && (
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Descrição do Serviço</h4>
                            <p className="text-sm text-muted-foreground">{agendamento.servico.descricao}</p>
                          </div>
                        )}

                        {/* Observações */}
                        {agendamento.observacoes && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Observações</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{agendamento.observacoes}</p>
                          </div>
                        )}

                        {/* Motivo da Rejeição */}
                        {agendamento.motivo_rejeicao && (
                          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              <span className="font-medium text-sm text-red-800 dark:text-red-200">Motivo da Rejeição</span>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300">{agendamento.motivo_rejeicao}</p>
                          </div>
                        )}

                        {/* Fotos (se houver) */}
                        {agendamento.fotos && agendamento.fotos.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-primary" />
                              Fotos do Serviço
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {agendamento.fotos.map((foto, index) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden border border-border">
                                  <img 
                                    src={foto} 
                                    alt={`Foto ${index + 1} do serviço`}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadados */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="text-xs text-muted-foreground">
                            Criado em: {formatarDataHora(agendamento.criado_em).data} às {formatarDataHora(agendamento.criado_em).hora}
                          </div>
                          {agendamento.atualizado_em !== agendamento.criado_em && (
                            <div className="text-xs text-muted-foreground">
                              Atualizado em: {formatarDataHora(agendamento.atualizado_em).data} às {formatarDataHora(agendamento.atualizado_em).hora}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
