import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

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
  criado_em: string;
  observacoes?: string;
  // Joined data
  cliente_nome?: string;
  cliente_telefone?: string;
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
      if (!profile?.salao_id) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          servico:servico_id(nome, duracao_minutos, preco)
        `)
        .eq('salao_id', profile.salao_id)
        .order('data_hora', { ascending: true });

      if (error) throw error;

      // Get client and professional names separately
      const appointmentsWithNames = await Promise.all(
        (data || []).map(async (apt) => {
          const [clientData, professionalData] = await Promise.all([
            supabase.from('users').select('nome, telefone').eq('id', apt.cliente_id).single(),
            supabase.from('employees').select('nome').eq('id', apt.funcionario_id).single()
          ]);
          
          return {
            ...apt,
            cliente_nome: clientData.data?.nome,
            cliente_telefone: clientData.data?.telefone || undefined,
            funcionario_nome: professionalData.data?.nome,
            servico_nome: apt.servico?.nome,
            servico_duracao: apt.servico?.duracao_minutos,
            servico_preco: apt.servico?.preco
          } as Appointment;
        })
      );

      return appointmentsWithNames;
    },
    enabled: !!profile?.salao_id,
    staleTime: 30000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Mutation para criar agendamento
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: {
      cliente_id: string;
      funcionario_id: string;
      servico_id: string;
      data_hora: string;
      motivo_cancelamento?: string;
      observacoes?: string;
    }) => {
      if (!profile?.salao_id) throw new Error('Salon ID não encontrado');

      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointmentData, salao_id: profile.salao_id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', profile?.salao_id] });
      toast({
        title: 'Agendamento criado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || 'Erro ao criar agendamento'
      });
    }
  });

  // Mutation para atualizar agendamento
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Appointment> }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', profile?.salao_id] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || 'Erro ao atualizar agendamento'
      });
    }
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
      queryClient.invalidateQueries({ queryKey: ['appointments', profile?.salao_id] });
      toast({
        title: 'Agendamento excluído com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || 'Erro ao excluir agendamento'
      });
    }
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