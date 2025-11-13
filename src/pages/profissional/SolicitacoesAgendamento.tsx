import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointmentRequests, AppointmentRequest } from '@/hooks/useAppointmentRequests';
import ProfissionalLayout from '@/components/layout/ProfissionalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, Eye, MessageSquare, Search, Filter, RefreshCw, Trash2, Scissors, Link, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fixTimezone } from '@/utils/dateUtils';

export default function SolicitacoesAgendamento() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
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
    if (profile?.salao_id) {
      loadRequests();
    }
  }, [profile?.salao_id]);

  const loadRequests = async () => {
    if (!profile?.salao_id) return;
    
    const data = await fetchAppointmentRequests(profile.salao_id);
    // Filtrar apenas solicitações do profissional logado
    const myRequests = data.filter(request => request.funcionario_id === user?.id);
    setRequests(myRequests);
  };

  const copyPublicLink = async () => {
    const salaoId = profile?.salao_id;
    
    if (!salaoId) {
      toast({
        title: "Erro",
        description: "ID do salão não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }
    
    const publicUrl = `${window.location.origin}/salao/${salaoId}`;
    
    try {
      if (!navigator.clipboard) {
        const textArea = document.createElement('textarea');
        textArea.value = publicUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setLinkCopied(true);
        toast({
          title: "Sucesso",
          description: "Link copiado para a área de transferência!"
        });
        
        setTimeout(() => {
          setLinkCopied(false);
        }, 2000);
        return;
      }
      
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      toast.success('Link copiado para a área de transferência!');
      
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
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
    if (!requestId || requestId.trim() === '') {
      toast({
        title: "Erro",
        description: "ID da solicitação inválido",
        variant: "destructive"
      });
      return;
    }
    if (!user?.id || user.id.trim() === '') {
      toast({
        title: "Erro",
        description: "ID do usuário inválido",
        variant: "destructive"
      });
      return;
    }

    try {
      const success = await approveAppointmentRequest(requestId, user.id);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Solicitação aprovada com sucesso!"
        });
        loadRequests();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao aprovar solicitação",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast({
        title: "Erro",
        description: `Erro ao aprovar solicitação: ${error}`,
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) {
      toast({
        title: "Erro",
        description: "Nenhuma solicitação selecionada",
        variant: "destructive"
      });
      return;
    }
    if (!selectedRequest.id || selectedRequest.id.trim() === '') {
      toast({
        title: "Erro",
        description: "ID da solicitação inválido",
        variant: "destructive"
      });
      return;
    }
    if (!user?.id || user.id.trim() === '') {
      toast({
        title: "Erro",
        description: "ID do usuário inválido",
        variant: "destructive"
      });
      return;
    }
    if (!rejectReason || rejectReason.trim() === '') {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive"
      });
      return;
    }

    console.log('Debug - Parâmetros para rejeição:', {
      requestId: selectedRequest.id,
      motivoRejeicao: rejectReason,
      rejeitadoPor: user.id
    });

    try {
      const success = await rejectAppointmentRequest(selectedRequest.id, rejectReason, user.id);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Solicitação rejeitada com sucesso!"
        });
        setRejectDialogOpen(false);
        setSelectedRequest(null);
        setRejectReason('');
        loadRequests();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao rejeitar solicitação",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast({
        title: "Erro",
        description: `Erro ao rejeitar solicitação: ${error}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!requestId || requestId.trim() === '') {
      toast({
        title: "Erro",
        description: "ID da solicitação inválido",
        variant: "destructive"
      });
      return;
    }

    try {
      const success = await deleteAppointmentRequest(requestId);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Solicitação excluída com sucesso!"
        });
        loadRequests();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir solicitação",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      toast({
        title: "Erro",
        description: `Erro ao excluir solicitação: ${error}`,
        variant: "destructive"
      });
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    // Extrair data e hora diretamente em UTC sem conversão
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: 'Pendente', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      aprovado: { label: 'Aprovado', variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' },
      rejeitado: { label: 'Rejeitado', variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
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
    <ProfissionalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Solicitações de Agendamento</h1>
              <p className="text-muted-foreground">
                Gerencie as solicitações de agendamento dos seus clientes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyPublicLink}
              className="flex items-center gap-2"
            >
              {linkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {linkCopied ? 'Copiado!' : 'Copiar Link Público'}
            </Button>
            <Button onClick={loadRequests} disabled={isLoading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Busca */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-3 w-3" />
                      {label} ({count})
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
                            <Scissors className="h-4 w-4 text-primary" />
                            <span className="font-medium">{request.servico?.nome || 'Não definido'}</span>
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
                              <span className="font-medium text-sm text-primary">Serviço</span>
                            </div>
                            <p className="text-foreground">{request.servico?.nome || 'Serviço não definido'}</p>
                            {request.servico?.preco && (
                              <p className="text-sm text-muted-foreground mt-1">
                                R$ {request.servico.preco.toFixed(2)}
                              </p>
                            )}
                          </div>

                          {/* Observações */}
                          {request.observacoes && (
                            <div className="bg-muted/30 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm text-muted-foreground">Observações</span>
                              </div>
                              <p className="text-foreground">{request.observacoes}</p>
                            </div>
                          )}

                          {/* Informações do Cliente */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{request.cliente_email || 'Email não informado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Cliente {request.cliente_id ? 'cadastrado' : 'não cadastrado'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2 ml-4">
                        {request.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                setRejectDialogOpen(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(request.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal de Rejeição */}
        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeitar Solicitação</AlertDialogTitle>
              <AlertDialogDescription>
                Informe o motivo da rejeição para {selectedRequest?.cliente_nome}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-reason">Motivo da Rejeição</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Ex: Horário não disponível, serviço não oferecido..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setRejectDialogOpen(false);
                setSelectedRequest(null);
                setRejectReason('');
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                Rejeitar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProfissionalLayout>
  );
}
