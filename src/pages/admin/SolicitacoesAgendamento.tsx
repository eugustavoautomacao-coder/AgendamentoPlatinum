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
    if (!user?.id) return;
    
    const success = await approveAppointmentRequest(requestId, user.id);
    if (success) {
      toast.success('Solicitação aprovada com sucesso!');
      loadRequests();
    } else {
      toast.error('Erro ao aprovar solicitação');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user?.id) return;
    
    const success = await rejectAppointmentRequest(selectedRequest.id, user.id, rejectReason);
    if (success) {
      toast.success('Solicitação rejeitada');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedRequest(null);
      loadRequests();
    } else {
      toast.error('Erro ao rejeitar solicitação');
    }
  };

  const handleDelete = async (requestId: string) => {
    const success = await deleteAppointmentRequest(requestId);
    if (success) {
      toast.success('Solicitação removida');
      loadRequests();
    } else {
      toast.error('Erro ao remover solicitação');
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              Solicitações de Agendamento
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie as solicitações de agendamento online</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyPublicLink}
              className="flex items-center gap-2"
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
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Campo de Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, telefone, email, serviço ou profissional..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filtros de Status */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pendente', 'aprovado', 'rejeitado'] as const).map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(filterType)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-3 w-3" />
                    {filterType === 'all' ? 'Todas' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Button>
                ))}
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
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {request.cliente_nome}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.criado_em).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">{date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">{time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-medium">{request.funcionario?.nome || 'Não definido'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            <Phone className="h-4 w-4 text-primary" />
                            <span className="font-medium">{request.cliente_telefone}</span>
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

                      <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
                        {request.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            
                            <AlertDialog open={rejectDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                              setRejectDialogOpen(open);
                              if (open) setSelectedRequest(request);
                              if (!open) setSelectedRequest(null);
                            }}>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="shadow-sm">
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
                            <Button size="sm" variant="outline" className="shadow-sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Detalhes da Solicitação</AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="font-semibold">Cliente</Label>
                                  <p className="text-gray-600">{request.cliente_nome}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Telefone</Label>
                                  <p className="text-gray-600">{request.cliente_telefone}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">E-mail</Label>
                                  <p className="text-gray-600">{request.cliente_email || 'Não informado'}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Status</Label>
                                  <div>{getStatusBadge(request.status)}</div>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="font-semibold">Serviço</Label>
                                <p className="text-gray-600">{request.servico?.nome}</p>
                                <p className="text-sm text-gray-500">
                                  Duração: {request.servico?.duracao_minutos} min • 
                                  Preço: R$ {request.servico?.preco?.toFixed(2)}
                                </p>
                              </div>
                              
                              <div>
                                <Label className="font-semibold">Profissional</Label>
                                <p className="text-gray-600">{request.funcionario?.nome || 'Não definido'}</p>
                              </div>
                              
                              <div>
                                <Label className="font-semibold">Data e Horário</Label>
                                <p className="text-gray-600">{date} às {time}</p>
                              </div>
                              
                              {request.observacoes && (
                                <div>
                                  <Label className="font-semibold">Observações</Label>
                                  <p className="text-gray-600">{request.observacoes}</p>
                                </div>
                              )}
                              
                              {request.motivo_rejeicao && (
                                <div>
                                  <Label className="font-semibold">Motivo da Rejeição</Label>
                                  <p className="text-red-600">{request.motivo_rejeicao}</p>
                                </div>
                              )}
                              
                              <div>
                                <Label className="font-semibold">Data da Solicitação</Label>
                                <p className="text-gray-600">
                                  {new Date(request.criado_em).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Fechar</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 shadow-sm">
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
