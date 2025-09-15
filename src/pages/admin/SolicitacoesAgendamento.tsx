import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointmentRequests, AppointmentRequest } from '@/hooks/useAppointmentRequests';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, Eye, MessageSquare, Search, Filter, RefreshCw, Trash2, Scissors, Link, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function SolicitacoesAgendamento() {
  const { user } = useAuth();
  const { 
    fetchAppointmentRequests, 
    approveAppointmentRequest, 
    rejectAppointmentRequest, 
    deleteAppointmentRequest,
    isLoading 
  } = useAppointmentRequests();
  
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'pendente' | 'aprovado' | 'rejeitado'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Calcular contadores para cada status
  const getStatusCounts = () => {
    const counts = {
      all: requests.length,
      pendente: requests.filter(r => r.status === 'pendente').length,
      aprovado: requests.filter(r => r.status === 'aprovado').length,
      rejeitado: requests.filter(r => r.status === 'rejeitado').length
    };
    return counts;
  };

  useEffect(() => {
    if (user?.user_metadata?.salao_id) {
      loadRequests();
    }
  }, [user?.user_metadata?.salao_id]);

  const loadRequests = async () => {
    if (!user?.user_metadata?.salao_id) return;
    
    const data = await fetchAppointmentRequests(user.user_metadata.salao_id);
    setRequests(data);
  };

  const copyPublicLink = async () => {
    // Obter o salao_id do user_metadata
    const salaoId = user?.user_metadata?.salao_id;
    
    if (!salaoId) {
      toast.error('ID do salão não encontrado. Faça login novamente.');
      return;
    }
    
    const publicUrl = `${window.location.origin}/salao/${salaoId}`;
    
    try {
      // Verificar se a API de clipboard está disponível
      if (!navigator.clipboard) {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = publicUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setLinkCopied(true);
        toast.success('Link copiado para a área de transferência!');
        
        setTimeout(() => {
          setLinkCopied(false);
        }, 2000);
        return;
      }
      
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      toast.success('Link copiado para a área de transferência!');
      
      // Reset do estado após 2 segundos
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      // Fallback manual
      const textArea = document.createElement('textarea');
      textArea.value = publicUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setLinkCopied(true);
      toast.success('Link copiado para a área de transferência!');
      
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    }
  };

  const handleApprove = async (requestId: string) => {
    // Validações completas
    if (!requestId || requestId.trim() === '') {
      toast.error('ID da solicitação inválido');
      return;
    }
    
    if (!user?.id || user.id.trim() === '') {
      toast.error('ID do usuário inválido');
      return;
    }
    
    try {
      const success = await approveAppointmentRequest(requestId, user.id);
      if (success) {
        toast.success('Solicitação aprovada com sucesso!');
        loadRequests();
      } else {
        toast.error('Erro ao aprovar solicitação');
      }
    } catch (error) {
      console.error('Erro detalhado ao aprovar:', error);
      toast.error(`Erro ao aprovar solicitação: ${error}`);
    }
  };

  const handleReject = async () => {
    // Validações completas
    if (!selectedRequest) {
      toast.error('Nenhuma solicitação selecionada');
      return;
    }
    
    if (!selectedRequest.id || selectedRequest.id.trim() === '') {
      toast.error('ID da solicitação inválido');
      return;
    }
    
    if (!user?.id || user.id.trim() === '') {
      toast.error('ID do usuário inválido');
      return;
    }
    
    // Validação do motivo da rejeição
    if (!rejectReason || rejectReason.trim() === '') {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }
    
    // Log para debug
    console.log('Debug - Rejeitando solicitação:', {
      requestId: selectedRequest.id,
      motivo: rejectReason,
      userId: user.id
    });
    
    try {
      const success = await rejectAppointmentRequest(selectedRequest.id, rejectReason, user.id);
      if (success) {
        toast.success('Solicitação rejeitada');
        setRejectDialogOpen(false);
        setRejectReason('');
        setSelectedRequest(null);
        loadRequests();
      } else {
        toast.error('Erro ao rejeitar solicitação');
      }
    } catch (error) {
      console.error('Erro detalhado ao rejeitar:', error);
      toast.error(`Erro ao rejeitar solicitação: ${error}`);
    }
  };

  const handleDelete = async (requestId: string) => {
    // Validações completas
    if (!requestId || requestId.trim() === '') {
      toast.error('ID da solicitação inválido');
      return;
    }
    
    try {
      const success = await deleteAppointmentRequest(requestId);
      if (success) {
        toast.success('Solicitação removida');
        loadRequests();
      } else {
        toast.error('Erro ao remover solicitação');
      }
    } catch (error) {
      console.error('Erro detalhado ao deletar:', error);
      toast.error(`Erro ao remover solicitação: ${error}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: 'default',
      aprovado: 'default',
      rejeitado: 'destructive',
      cancelado: 'secondary'
    } as const;

    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      aprovado: 'bg-green-100 text-green-800 border-green-200',
      rejeitado: 'bg-red-100 text-red-800 border-red-200',
      cancelado: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = searchTerm === '' || 
      request.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.cliente_telefone.includes(searchTerm) ||
      (request.cliente_email && request.cliente_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.servico?.nome && request.servico.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.funcionario?.nome && request.funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Solicitações de Agendamento</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie as solicitações de agendamento online</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyPublicLink}
              className="flex items-center gap-2 w-full sm:w-auto"
              title="Copiar link da página pública do salão"
            >
              {linkCopied ? (
                <>
                  <Copy className="h-4 w-4 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" />
                  Copiar Link
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadRequests}
              disabled={isLoading}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Campo de Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, telefone, email, serviço ou profissional..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:max-w-sm"
                  />
                </div>
              </div>
              
              {/* Filtros de Status */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pendente', 'aprovado', 'rejeitado'] as const).map((filterType) => {
                  const counts = getStatusCounts();
                  const count = counts[filterType];
                  const label = filterType === 'all' ? 'Todas' : filterType.charAt(0).toUpperCase() + filterType.slice(1);
                  
                  return (
                    <Button
                      key={filterType}
                      variant={filter === filterType ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterType)}
                      className="flex items-center gap-2 flex-1 sm:flex-none"
                    >
                      <Filter className="h-3 w-3" />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{label.charAt(0)}</span>
                      <span>({count})</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Contador de Resultados */}
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredRequests.length} de {requests.length} solicitações
              {searchTerm && ` • Buscando por "${searchTerm}"`}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando solicitações...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Não há solicitações de agendamento ainda.'
                  : `Não há solicitações com status "${filter}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => {
              const { date, time } = formatDateTime(request.data_hora);
              
              return (
                <Card key={request.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg font-semibold text-foreground truncate">
                                {request.cliente_nome}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(request.criado_em).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <User className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{request.funcionario?.nome || 'Não definido'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{request.cliente_telefone}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Serviço */}
                          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Scissors className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-foreground">Serviço</span>
                            </div>
                            <p className="text-foreground font-medium">{request.servico?.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.servico?.duracao_minutos} min • R$ {request.servico?.preco?.toFixed(2)}
                            </p>
                          </div>
                          
                          {/* Email do Cliente */}
                          {request.cliente_email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                              <Mail className="h-4 w-4 text-primary" />
                              <span className="font-medium">{request.cliente_email}</span>
                            </div>
                          )}
                          
                          {/* Observações */}
                          {request.observacoes && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                <span className="font-semibold text-amber-900 dark:text-amber-100">Observações</span>
                              </div>
                              <p className="text-amber-800 dark:text-amber-200">{request.observacoes}</p>
                            </div>
                          )}

                          {/* Motivo da Rejeição */}
                          {request.motivo_rejeicao && (
                            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <span className="font-semibold text-red-900 dark:text-red-100">Motivo da Rejeição</span>
                              </div>
                              <p className="text-red-800 dark:text-red-200">{request.motivo_rejeicao}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto lg:min-w-[120px]">
                        {request.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex-1 sm:flex-none"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            
                            <AlertDialog open={rejectDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                              if (open) {
                                setSelectedRequest(request);
                                setRejectDialogOpen(true);
                              } else {
                                setRejectDialogOpen(false);
                                setSelectedRequest(null);
                                setRejectReason(''); // Limpar motivo ao fechar
                              }
                            }}>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="shadow-sm flex-1 sm:flex-none">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejeitar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Rejeitar Solicitação</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Informe o motivo da rejeição para o cliente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                  <Label htmlFor="reject-reason">Motivo da rejeição</Label>
                                  <Textarea
                                    id="reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Ex: Horário não disponível, serviço indisponível..."
                                    rows={3}
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                                    Rejeitar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="shadow-sm flex-1 sm:flex-none">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Detalhes da Solicitação
                              </AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                              {/* Informações do Cliente */}
                              <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                                <CardHeader className="pb-2 px-4 pt-4">
                                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                                    <User className="h-4 w-4 text-primary" />
                                    Informações do Cliente
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 px-4 pb-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <Label className="font-semibold text-foreground text-sm">Nome</Label>
                                      <p className="text-muted-foreground text-sm">{request.cliente_nome}</p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold text-foreground text-sm">Telefone</Label>
                                      <p className="text-muted-foreground text-sm">{request.cliente_telefone}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <Label className="font-semibold text-foreground text-sm">E-mail</Label>
                                      <p className="text-muted-foreground text-sm break-all">{request.cliente_email || 'Não informado'}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Status */}
                              <Card className="border-border">
                                <CardContent className="pt-4 px-4 pb-4">
                                  <div className="flex items-center justify-between">
                                    <Label className="font-semibold text-foreground">Status da Solicitação</Label>
                                    {getStatusBadge(request.status)}
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Detalhes do Serviço */}
                              <Card className="border-border">
                                <CardHeader className="pb-2 px-4 pt-4">
                                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                                    <Scissors className="h-4 w-4 text-primary" />
                                    Serviço Solicitado
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div>
                                    <Label className="font-semibold text-foreground">Nome do Serviço</Label>
                                    <p className="text-muted-foreground">{request.servico?.nome}</p>
                                  </div>
                                  <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-primary" />
                                      <span className="text-muted-foreground">
                                        {request.servico?.duracao_minutos} min
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">
                                        R$ {request.servico?.preco?.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Profissional e Horário */}
                              <Card className="border-border">
                                <CardHeader className="pb-2 px-4 pt-4">
                                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Agendamento
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 px-4 pb-4">
                                  <div>
                                    <Label className="font-semibold text-foreground">Profissional</Label>
                                    <p className="text-muted-foreground">{request.funcionario?.nome || 'Não definido'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold text-foreground">Data e Horário</Label>
                                    <p className="text-muted-foreground">{date} às {time}</p>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Observações */}
                              {request.observacoes && (
                                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                                  <CardHeader className="pb-2 px-4 pt-4">
                                    <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
                                      <MessageSquare className="h-4 w-4" />
                                      Observações
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="px-4 pb-4">
                                    <p className="text-amber-700 dark:text-amber-300">{request.observacoes}</p>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Motivo da Rejeição */}
                              {request.motivo_rejeicao && (
                                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                                  <CardHeader className="pb-2 px-4 pt-4">
                                    <CardTitle className="text-base flex items-center gap-2 text-red-800 dark:text-red-200">
                                      <XCircle className="h-4 w-4" />
                                      Motivo da Rejeição
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="px-4 pb-4">
                                    <p className="text-red-700 dark:text-red-300">{request.motivo_rejeicao}</p>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Data da Solicitação */}
                              <Card className="border-border bg-muted/30">
                                <CardContent className="pt-4 px-4 pb-4">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Label className="font-semibold text-foreground">Data da Solicitação</Label>
                                  </div>
                                  <p className="text-muted-foreground mt-1">
                                    {new Date(request.criado_em).toLocaleString('pt-BR')}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                                Fechar
                              </AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 shadow-sm flex-1 sm:flex-none">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Solicitação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(request.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}