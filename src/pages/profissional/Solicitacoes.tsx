import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointmentRequests, AppointmentRequest } from '@/hooks/useAppointmentRequests';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Phone, MessageSquare, Search, Filter, RefreshCw, Scissors, List, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fixTimezone } from '@/utils/dateUtils';

export default function ProfissionalSolicitacoes() {
  const { user, profile } = useAuth();
  const { 
    fetchAppointmentRequests,
    isLoading 
  } = useAppointmentRequests();
  
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pendente' | 'aprovado' | 'rejeitado'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Função para carregar solicitações
  const loadRequests = async () => {
    try {
      const salaoId = user?.user_metadata?.salao_id || profile?.salao_id;
      
      if (!salaoId || !profile?.id) {
        return;
      }
      
      // Buscar todas as solicitações do salão (igual ao admin)
      const allRequests = await fetchAppointmentRequests(salaoId);
      
      // Buscar o employee_id do profissional
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      
      if (employeeError) {
        console.error('Erro ao buscar employee:', employeeError);
        return;
      }
      
      // Filtrar apenas as solicitações direcionadas a este profissional
      const professionalRequests = allRequests.filter(request => {
        // Incluir solicitações específicas para este profissional
        // E também solicitações gerais (sem funcionario_id definido)
        return request.funcionario_id === employee.id || !request.funcionario_id;
      });
      
      setRequests(professionalRequests);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
    }
  };

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
    // Tentar usar profile.salao_id se user.user_metadata.salao_id não estiver disponível
    const salaoId = user?.user_metadata?.salao_id || profile?.salao_id;
    
    if (salaoId && profile?.id) {
      loadRequests();
    }
  }, [user?.user_metadata?.salao_id, profile?.salao_id, profile?.id]);


  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      aprovado: 'bg-green-100 text-green-800 border-green-200',
      rejeitado: 'bg-red-100 text-red-800 border-red-200',
      cancelado: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const statusText = {
      pendente: 'Aprovação Pendente',
      aprovado: 'Aprovado',
      rejeitado: 'Rejeitado',
      cancelado: 'Cancelado'
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants] || variants.pendente} border`}>
        {statusText[status as keyof typeof statusText] || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = searchTerm === '' || 
      request.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.cliente_telefone.includes(searchTerm) ||
      request.servico?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-pink-500" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Minhas Solicitações</h1>
            <p className="text-muted-foreground">
              Solicitações de agendamento direcionadas a você
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRequests} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <List className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.all}</div>
            <p className="text-xs text-muted-foreground">
              Solicitações recebidas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pendente}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.aprovado}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejeitado}</div>
            <p className="text-xs text-muted-foreground">
              Não aprovadas
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por cliente, telefone ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                Todas ({statusCounts.all})
              </Button>
              <Button
                variant={filter === 'pendente' ? 'default' : 'outline'}
                onClick={() => setFilter('pendente')}
                size="sm"
              >
                Pendentes ({statusCounts.pendente})
              </Button>
              <Button
                variant={filter === 'aprovado' ? 'default' : 'outline'}
                onClick={() => setFilter('aprovado')}
                size="sm"
              >
                Aprovadas ({statusCounts.aprovado})
              </Button>
              <Button
                variant={filter === 'rejeitado' ? 'default' : 'outline'}
                onClick={() => setFilter('rejeitado')}
                size="sm"
              >
                Rejeitadas ({statusCounts.rejeitado})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {filter === 'all' 
                  ? 'Você ainda não recebeu nenhuma solicitação de agendamento.'
                  : `Não há solicitações com status "${filter}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.cliente_nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{request.cliente_telefone}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{request.servico?.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(fixTimezone(request.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {request.observacoes && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm text-muted-foreground">{request.observacoes}</span>
                      </div>
                    )}

                    {request.motivo_rejeicao && (
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span className="text-sm text-red-600">{request.motivo_rejeicao}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
