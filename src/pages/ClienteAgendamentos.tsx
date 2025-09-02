import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClienteAuth } from '@/hooks/useClienteAuth';
import { useClienteAgendamentos } from '@/hooks/useClienteAgendamentos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  LogOut,
  ArrowLeft,
  RefreshCw,
  Plus
} from 'lucide-react';

export const ClienteAgendamentos: React.FC = () => {
  const { salaoId } = useParams<{ salaoId: string }>();
  const navigate = useNavigate();
  const { cliente, logout, isAuthenticated } = useClienteAuth();
  const { 
    agendamentos, 
    loading, 
    loadAgendamentos, 
    cancelarAgendamento,
    getContadores,
    lastUpdate,
    refreshData,
    setupRealtimeSync
  } = useClienteAgendamentos();

  const contadores = getContadores();
  const [activeTab, setActiveTab] = useState('todos');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && cliente && salaoId) {
      loadAgendamentos(cliente.email, salaoId);
    }
  }, [isAuthenticated, cliente, salaoId, loadAgendamentos]);

  // Configurar sincronização em tempo real
  useEffect(() => {
    if (!isAuthenticated || !cliente || !salaoId) return;

    const unsubscribe = setupRealtimeSync(cliente.email, salaoId);
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, cliente, salaoId, setupRealtimeSync]);

  // Atualização automática a cada 30 segundos (fallback)
  useEffect(() => {
    if (!isAuthenticated || !cliente || !salaoId) return;

    const interval = setInterval(() => {
      refreshData(cliente.email, salaoId);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated, cliente, salaoId, refreshData]);

  const handleLogout = () => {
    logout();
    navigate(`/salao/${salaoId}`);
  };

  const handleCancelarAgendamento = async (agendamentoId: string) => {
    const success = await cancelarAgendamento(agendamentoId);
    if (success) {
      // Recarregar agendamentos
      if (cliente && salaoId) {
        loadAgendamentos(cliente.email, salaoId);
      }
    }
  };

  const handleRefresh = async () => {
    if (!cliente || !salaoId) return;
    
    setRefreshing(true);
    try {
      await refreshData(cliente.email, salaoId);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { 
        label: 'Pendente', 
        variant: 'secondary' as const, 
        icon: Clock,
        color: 'text-yellow-600 dark:text-yellow-400'
      },
      aprovado: { 
        label: 'Aprovado', 
        variant: 'default' as const, 
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400'
      },
      rejeitado: { 
        label: 'Rejeitado', 
        variant: 'destructive' as const, 
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400'
      },
      cancelado: { 
        label: 'Cancelado', 
        variant: 'outline' as const, 
        icon: AlertCircle,
        color: 'text-gray-600 dark:text-gray-400'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatarDataHora = (dataHora: string) => {
    const data = new Date(dataHora);
    return {
      data: data.toLocaleDateString('pt-BR'),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (!isAuthenticated || !cliente) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/salao/${salaoId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Meus Agendamentos</h1>
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
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
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
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
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
                  <p className="text-sm text-muted-foreground">Aprovados</p>
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
                  <p className="text-sm text-muted-foreground">Rejeitados</p>
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
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">{contadores.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão Nova Solicitação */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => navigate(`/salao/${salaoId}`)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>

        {/* Tabs de Filtros */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="todos" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Todos ({contadores.total})
            </TabsTrigger>
            <TabsTrigger value="pendente" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendentes ({contadores.pendentes})
            </TabsTrigger>
            <TabsTrigger value="aprovado" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Aprovados ({contadores.aprovados})
            </TabsTrigger>
            <TabsTrigger value="rejeitado" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejeitados ({contadores.rejeitados})
            </TabsTrigger>
            <TabsTrigger value="cancelado" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Cancelados ({contadores.cancelados})
            </TabsTrigger>
          </TabsList>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando agendamentos...</p>
              </div>
            </div>
          )}

          {/* Tab Todos */}
          <TabsContent value="todos" className="space-y-4">
            {agendamentos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento encontrado</h3>
                  <p className="text-muted-foreground mb-6">Você ainda não possui agendamentos.</p>
                  <Button
                    onClick={() => navigate(`/salao/${salaoId}`)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Fazer Primeira Solicitação
                  </Button>
                </CardContent>
              </Card>
            ) : (
              agendamentos.map((agendamento) => (
                <Card key={agendamento.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{agendamento.servico.nome}</CardTitle>
                      {getStatusBadge(agendamento.status)}
                    </div>
                    <CardDescription>
                      {formatarDataHora(agendamento.data_hora).data} às {formatarDataHora(agendamento.data_hora).hora}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Profissional: {agendamento.funcionario.nome}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Preço: R$ {agendamento.servico.preco.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Duração: {agendamento.servico.duracao_minutos} min</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">Telefone: {agendamento.cliente_telefone}</span>
                      </div>
                    </div>

                    {agendamento.observacoes && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Observações</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{agendamento.observacoes}</p>
                      </div>
                    )}

                    {agendamento.motivo_rejeicao && (
                      <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="font-medium text-sm text-red-800 dark:text-red-200">Motivo da Rejeição</span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300">{agendamento.motivo_rejeicao}</p>
                      </div>
                    )}

                    {agendamento.status === 'pendente' && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelarAgendamento(agendamento.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Cancelar Agendamento
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Outras tabs com filtros similares */}
          {['pendente', 'aprovado', 'rejeitado', 'cancelado'].map((status) => {
            // Função de filtro mais robusta
            const getFilteredAgendamentos = (targetStatus: string) => {
              const filtered = agendamentos.filter(ag => {
                // Normalizar ambos os valores para comparação
                const agStatus = ag.status?.toLowerCase().trim();
                const target = targetStatus.toLowerCase().trim();
                
                return agStatus === target;
              });
              
              return filtered;
            };
            
            const filteredAgendamentos = getFilteredAgendamentos(status);
            
            // Mapear status para labels de exibição
            const getStatusLabel = (status: string) => {
              const labels = {
                'pendente': 'Pendente',
                'aprovado': 'Aprovado', 
                'rejeitado': 'Rejeitado',
                'cancelado': 'Cancelado'
              };
              return labels[status as keyof typeof labels] || status;
            };
            
            // Mapear status para mensagens de estado vazio
            const getEmptyMessage = (status: string) => {
              const messages = {
                'pendente': 'Você não possui solicitações pendentes de aprovação.',
                'aprovado': 'Você não possui agendamentos aprovados.',
                'rejeitado': 'Você não possui solicitações rejeitadas.',
                'cancelado': 'Você não possui agendamentos cancelados.'
              };
              return messages[status as keyof typeof messages] || 'Nenhum agendamento encontrado.';
            };
            
            return (
              <TabsContent key={status} value={status} className="space-y-4">
                {filteredAgendamentos.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        {status === 'pendente' && <Clock className="h-12 w-12 text-muted-foreground" />}
                        {status === 'aprovado' && <CheckCircle className="h-12 w-12 text-muted-foreground" />}
                        {status === 'rejeitado' && <XCircle className="h-12 w-12 text-muted-foreground" />}
                        {status === 'cancelado' && <AlertCircle className="h-12 w-12 text-muted-foreground" />}
                        
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Nenhum agendamento {getStatusLabel(status).toLowerCase()}
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            {getEmptyMessage(status)}
                          </p>
                          <Button
                            onClick={() => navigate(`/salao/${salaoId}`)}
                            variant="outline"
                            className="flex items-center gap-2 mx-auto"
                          >
                            <Plus className="h-4 w-4" />
                            Nova Solicitação
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAgendamentos.map((agendamento) => (
                    <Card key={agendamento.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{agendamento.servico.nome}</CardTitle>
                          {getStatusBadge(agendamento.status)}
                        </div>
                        <CardDescription>
                          {formatarDataHora(agendamento.data_hora).data} às {formatarDataHora(agendamento.data_hora).hora}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Profissional: {agendamento.funcionario.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">Preço: R$ {agendamento.servico.preco.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">Duração: {agendamento.servico.duracao_minutos} min</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span className="font-medium">Telefone: {agendamento.cliente_telefone}</span>
                          </div>
                        </div>

                        {agendamento.observacoes && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Observações</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{agendamento.observacoes}</p>
                          </div>
                        )}

                        {agendamento.motivo_rejeicao && (
                          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              <span className="font-medium text-sm text-red-800 dark:text-red-200">Motivo da Rejeição</span>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300">{agendamento.motivo_rejeicao}</p>
                          </div>
                        )}

                        {agendamento.status === 'pendente' && (
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelarAgendamento(agendamento.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Cancelar Agendamento
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

