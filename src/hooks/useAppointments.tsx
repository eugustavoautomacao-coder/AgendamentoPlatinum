import { useState, useEffect } from 'react';
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (!profile?.salao_id) return;
    
    try {
      setLoading(true);
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

      setAppointments(appointmentsWithNames);

    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar agendamentos"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: {
    cliente_id: string;
    funcionario_id: string;
    servico_id: string;
    data_hora: string;
    motivo_cancelamento?: string;
    observacoes?: string;
  }) => {
    if (!profile?.salao_id) return { error: 'Salon ID não encontrado' };

    try {
      // Get service duration (optional for future calculations)
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duracao_minutos')
        .eq('id', appointmentData.servico_id)
        .single();

      if (serviceError) throw serviceError;

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          ...appointmentData,
          salao_id: profile.salao_id,
          status: 'pendente'
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchAppointments();
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso"
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar agendamento"
      });
      return { data: null, error };
    }
  };

  const updateAppointment = async (id: string, appointmentData: Partial<Appointment>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchAppointments();
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso"
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar agendamento"
      });
      return { data: null, error };
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchAppointments();
      toast({
        title: "Sucesso",
        description: "Agendamento cancelado com sucesso"
      });
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cancelar agendamento"
      });
      return { error };
    }
  };

  useEffect(() => {
    if (profile?.salao_id) {
      fetchAppointments();
    }
  }, [profile?.salao_id]);

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments
  };
}