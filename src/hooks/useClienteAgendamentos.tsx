import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EmailService } from '@/services/emailService';
import { AgendamentoEmailData } from '@/settings/email.config';

export interface ClienteAgendamento {
  id: string;
  cliente_id?: string;
  funcionario_id: string;
  servico_id: string;
  data_hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido' | 'aprovado' | 'rejeitado';
  motivo_cancelamento?: string;
  data_conclusao?: string;
  employee_id?: string;
  salao_id: string;
  observacoes?: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  criado_em: string;
  tipo?: 'pendente' | 'confirmado' | 'aprovado';
  servico: {
    nome: string;
    duracao_minutos: number;
    preco: number;
  };
  funcionario: {
    nome: string;
  };
}

export const useClienteAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<ClienteAgendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const emailService = new EmailService();

  // Buscar agendamentos do cliente
  const loadAgendamentos = useCallback(async (clienteEmail: string, salaoId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando agendamentos para:', { clienteEmail, salaoId });
      
      // Verificar se o cliente existe na tabela clientes
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('email', clienteEmail);
      
      console.log('👤 Cliente encontrado na tabela clientes:', { clienteData, clienteError });
      
      // Primeiro, vamos verificar se há agendamentos na tabela appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('cliente_email', clienteEmail);
      
      console.log('📋 Agendamentos encontrados (sem joins):', { appointmentsData, appointmentsError });
      
      // Verificar TODAS as solicitações (não apenas pendentes)
      const { data: allRequestsData, error: allRequestsError } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('cliente_email', clienteEmail);
      
      console.log('📋 TODAS as solicitações encontradas:', { allRequestsData, allRequestsError });
      
      // Verificar se há solicitações pendentes
      const { data: requestsData, error: requestsError } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('cliente_email', clienteEmail)
        .eq('status', 'pendente');
      
      console.log('📋 Solicitações pendentes encontradas:', { requestsData, requestsError });
      
      // Se não há agendamentos nem solicitações, vamos mostrar uma mensagem
      if ((!appointmentsData || appointmentsData.length === 0) && (!requestsData || requestsData.length === 0)) {
        console.log('ℹ️ Nenhum agendamento encontrado para este cliente');
      }
      
      // Buscar apenas agendamentos (pendentes, aprovados e rejeitados)
      const { data: requestsWithJoins, error: requestsWithJoinsError } = await supabase
        .from('appointment_requests')
        .select(`
          *,
          servico:services(nome, duracao_minutos, preco),
          funcionario:employees!appointment_requests_funcionario_id_fkey(nome, email, telefone)
        `)
        .eq('salao_id', salaoId)
        .eq('cliente_email', clienteEmail)
        .in('status', ['pendente', 'aprovado', 'rejeitado'])
        .order('data_hora', { ascending: false });

      console.log('📋 Agendamentos encontrados:', { requestsWithJoins, requestsWithJoinsError });

      if (requestsWithJoinsError) throw requestsWithJoinsError;

      // Mapear agendamentos com tipo baseado no status
      const allAgendamentos = (requestsWithJoins || []).map(req => ({
        ...req,
        tipo: req.status === 'pendente' ? 'pendente' as const : 
              req.status === 'aprovado' ? 'aprovado' as const : 
              req.status === 'rejeitado' ? 'rejeitado' as const : 'pendente' as const
      }));

      const sortedAgendamentos = allAgendamentos.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());

      console.log('📊 Total de agendamentos encontrados:', sortedAgendamentos.length);
      console.log('📋 Lista completa de agendamentos:', sortedAgendamentos);
      
      // Debug detalhado de cada item
      sortedAgendamentos.forEach((item, index) => {
        console.log(`📋 Item ${index + 1}:`, {
          id: item.id,
          tipo: item.tipo,
          status: item.status,
          data_hora: item.data_hora,
          cliente_nome: item.cliente_nome,
          servico_nome: item.servico?.nome,
          funcionario_nome: item.funcionario?.nome
        });
      });

      setAgendamentos(sortedAgendamentos);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      setError('Erro ao carregar agendamentos');
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Configurar sincronização em tempo real
  const setupRealtimeSync = useCallback((clienteEmail: string, salaoId: string) => {
    // Inscrever para mudanças na tabela appointment_requests
    const channel = supabase
      .channel(`appointment_requests_${clienteEmail}_${salaoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_requests',
          filter: `salao_id=eq.${salaoId} AND cliente_email=eq.${clienteEmail}`
        },
        (payload) => {
          console.log('Mudança detectada em tempo real:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Nova solicitação criada
            const newRequest = payload.new as ClienteAgendamento;
            setAgendamentos(prev => [newRequest, ...prev]);
            toast.success('Nova solicitação de agendamento recebida!');
          } else if (payload.eventType === 'UPDATE') {
            // Solicitação atualizada (aprovada, rejeitada, etc.)
            const updatedRequest = payload.new as ClienteAgendamento;
            setAgendamentos(prev => 
              prev.map(ag => 
                ag.id === updatedRequest.id 
                  ? { ...ag, ...updatedRequest }
                  : ag
              )
            );
            
            // Mostrar notificação baseada no status
            if (updatedRequest.status === 'aprovado') {
              toast.success('Sua solicitação foi aprovada!');
            } else if (updatedRequest.status === 'rejeitado') {
              toast.error('Sua solicitação foi rejeitada');
            }
          } else if (payload.eventType === 'DELETE') {
            // Solicitação removida
            const deletedRequest = payload.old as ClienteAgendamento;
            setAgendamentos(prev => prev.filter(ag => ag.id !== deletedRequest.id));
          }
          
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Atualizar agendamento específico (para sincronização em tempo real)
  const updateAgendamentoStatus = useCallback((agendamentoId: string, newStatus: string, additionalData?: any) => {
    setAgendamentos(prev => 
      prev.map(ag => 
        ag.id === agendamentoId 
          ? { 
              ...ag, 
              status: newStatus as any, 
              ...additionalData,
              atualizado_em: new Date().toISOString() 
            }
          : ag
      )
    );
    setLastUpdate(new Date());
  }, []);

  // Cancelar agendamento
  const cancelarAgendamento = async (agendamentoId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('appointment_requests')
        .update({ 
          status: 'cancelado',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', agendamentoId);

      if (error) throw error;

      // Atualizar lista local
      updateAgendamentoStatus(agendamentoId, 'cancelado');

      // Enviar email de cancelamento
      try {
        const agendamento = agendamentos.find(ag => ag.id === agendamentoId);
        if (agendamento) {
          const emailData: AgendamentoEmailData = {
            cliente_nome: agendamento.cliente_nome,
            cliente_email: agendamento.cliente_email,
            servico_nome: agendamento.servico?.nome || 'Serviço',
            funcionario_nome: agendamento.funcionario?.nome || 'Profissional',
            data_hora: agendamento.data_hora,
            preco: agendamento.servico?.preco || 0,
            duracao_minutos: agendamento.servico?.duracao_minutos || 60,
            observacoes: agendamento.observacoes
          };
          
          await emailService.enviarCancelamentoAgendamento(emailData);
          console.log('✅ Email de cancelamento enviado com sucesso');
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de cancelamento:', emailError);
        // Não falhar a operação principal por erro de email
      }

      toast.success('Agendamento cancelado com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
      setError('Erro ao cancelar agendamento');
      toast.error('Erro ao cancelar agendamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar agendamentos por status
  const getAgendamentosPorStatus = (status: string) => {
    return agendamentos.filter(ag => ag.status === status);
  };

  // Contar agendamentos por status
  const getContadores = () => {
    return {
      pendentes: agendamentos.filter(ag => ag.status === 'pendente' || ag.tipo === 'pendente').length,
      aprovados: agendamentos.filter(ag => ag.status === 'aprovado' || ag.tipo === 'aprovado').length,
      rejeitados: agendamentos.filter(ag => ag.status === 'rejeitado' || ag.tipo === 'rejeitado').length,
      total: agendamentos.length
    };
  };

  // Forçar atualização dos dados
  const refreshData = useCallback(async (clienteEmail: string, salaoId: string) => {
    await loadAgendamentos(clienteEmail, salaoId);
  }, [loadAgendamentos]);

  return {
    agendamentos,
    loading,
    error,
    lastUpdate,
    loadAgendamentos,
    cancelarAgendamento,
    getAgendamentosPorStatus,
    getContadores,
    updateAgendamentoStatus,
    refreshData,
    setupRealtimeSync
  };
};
