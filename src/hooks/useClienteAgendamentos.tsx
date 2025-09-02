import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClienteAgendamento {
  id: string;
  salao_id: string;
  servico_id: string;
  funcionario_id: string;
  data_hora: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string;
  observacoes?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  motivo_rejeicao?: string;
  aprovado_por?: string;
  aprovado_em?: string;
  appointment_id?: string;
  criado_em: string;
  atualizado_em: string;
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

  // Buscar agendamentos do cliente
  const loadAgendamentos = useCallback(async (clienteEmail: string, salaoId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('appointment_requests')
        .select(`
          *,
          servico:services(nome, duracao_minutos, preco),
          funcionario:employees(nome)
        `)
        .eq('salao_id', salaoId)
        .eq('cliente_email', clienteEmail)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      setAgendamentos(data || []);
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
      pendentes: agendamentos.filter(ag => ag.status === 'pendente').length,
      aprovados: agendamentos.filter(ag => ag.status === 'aprovado').length,
      rejeitados: agendamentos.filter(ag => ag.status === 'rejeitado').length,
      cancelados: agendamentos.filter(ag => ag.status === 'cancelado').length,
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
