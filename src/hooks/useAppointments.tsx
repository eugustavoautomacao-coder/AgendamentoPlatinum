import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { recalcularComissoesMensais } from '@/utils/commissionUtils';
import { monitorQueryPerformance } from '@/utils/performanceMonitor';
import { fetchCachedWithPagination, invalidatePaginationCache } from '@/utils/queryOptimization';

export interface Appointment {
  id: string;
  salao_id: string;
  cliente_id: string;
  funcionario_id: string;
  servico_id: string;
  data_hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  motivo_cancelamento?: string;
  data_conclusao?: string;
  criado_em?: string;
  observacoes?: string;
  // Dados diretos do cliente (para agendamentos de solicitações)
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  // Joined data (busca dinâmica)
  funcionario_nome?: string;
  servico_nome?: string;
  servico_duracao?: number;
  servico_preco?: number;
}

export function useAppointments() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar agendamentos com cache
  const {
    data: appointments,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['appointments', profile?.salao_id],
    queryFn: async (): Promise<Appointment[]> => {
      // Se não houver profile ainda, aguardar
      if (!profile) return [];
      
      // Se não houver salao_id, retornar array vazio (erro será tratado pela UI)
      if (!profile.salao_id) {
        console.warn('Profile sem salao_id - não é possível buscar agendamentos');
        return [];
      }
      
      return await monitorQueryPerformance('fetchAppointments', async () => {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            servico:services!servico_id(nome, duracao_minutos, preco)
          `)
          .eq('salao_id', profile.salao_id)
          .order('data_hora', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        throw error;
      }

      // Processar dados para incluir nomes dos clientes e funcionários
      // SEMPRE buscar dados atualizados da tabela users para garantir sincronização
      const appointmentsWithNames = await Promise.all(
        (data || []).map(async (apt) => {
          // Sempre buscar dados atualizados do cliente e funcionário
          // Só fazer a query se o ID existir (evitar query com id=eq.null)
          const [clientData, professionalData] = await Promise.all([
            apt.cliente_id 
              ? supabase.from('users').select('nome, telefone').eq('id', apt.cliente_id).single()
              : Promise.resolve({ data: null, error: null }),
            apt.funcionario_id
              ? supabase.from('employees').select('nome').eq('id', apt.funcionario_id).single()
              : Promise.resolve({ data: null, error: null })
          ]);
          
          return { 
            ...apt, 
            cliente_nome: clientData.data?.nome || apt.cliente_nome, 
            cliente_telefone: clientData.data?.telefone || apt.cliente_telefone || undefined, 
            funcionario_nome: professionalData.data?.nome || apt.funcionario_nome, 
            servico_nome: apt.servico?.nome, 
            servico_duracao: apt.servico?.duracao_minutos, 
            servico_preco: apt.servico?.preco 
          } as Appointment;
        })
      );

        return appointmentsWithNames;
      });
    },
    enabled: profile !== undefined && !!profile?.salao_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation para criar agendamento
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      // Validar campos obrigatórios
      if (!appointmentData.salao_id) {
        throw new Error('salao_id é obrigatório');
      }
      if (!appointmentData.funcionario_id) {
        throw new Error('funcionario_id é obrigatório');
      }
      if (!appointmentData.servico_id) {
        throw new Error('servico_id é obrigatório');
      }
      if (!appointmentData.data_hora) {
        throw new Error('data_hora é obrigatório');
      }
      
      // Garantir que o status seja definido
      const dataToInsert = {
        ...appointmentData,
        status: appointmentData.status || 'confirmado', // Status padrão se não for fornecido
        criado_em: new Date().toISOString()
      };

      console.log('Dados sendo inseridos no agendamento:', dataToInsert);

      const { data, error } = await supabase
        .from('appointments')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Recalcular comissões se o agendamento for concluído
      if (data.funcionario_id && data.status === 'concluido') {
        const appointmentDate = new Date(data.data_hora);
        const mes = appointmentDate.getMonth() + 1;
        const ano = appointmentDate.getFullYear();
        await recalcularComissoesMensais(data.funcionario_id, mes, ano);
      }
      
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar agendamento:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast({
        title: "Erro",
        description: `Erro ao criar agendamento: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar agendamento
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Recalcular comissões se o agendamento for concluído
      if (data.funcionario_id && data.status === 'concluido') {
        const appointmentDate = new Date(data.data_hora);
        const mes = appointmentDate.getMonth() + 1;
        const ano = appointmentDate.getFullYear();
        await recalcularComissoesMensais(data.funcionario_id, mes, ano);
      }
      
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar agendamento
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Sucesso",
        description: "Agendamento deletado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao deletar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Funções wrapper para manter compatibilidade
  const createAppointment = (data: any) => createAppointmentMutation.mutateAsync(data);
  const updateAppointment = (id: string, updates: any) => updateAppointmentMutation.mutateAsync({ id, updates });
  const deleteAppointment = (id: string) => deleteAppointmentMutation.mutateAsync(id);

  return {
    appointments: appointments || [],
    loading,
    error,
    refetch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    isCreating: createAppointmentMutation.isPending,
    isUpdating: updateAppointmentMutation.isPending,
    isDeleting: deleteAppointmentMutation.isPending
  };
}