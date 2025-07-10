import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Appointment {
  id: string;
  salon_id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  notes?: string;
  final_price?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  client_name?: string;
  professional_name?: string;
  service_name?: string;
  service_duration?: number;
  service_price?: number;
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (!profile?.salon_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(name, duration_minutes, base_price)
        `)
        .eq('salon_id', profile.salon_id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Get client and professional names separately
      const appointmentsWithNames = await Promise.all(
        (data || []).map(async (apt) => {
          const [clientData, professionalData] = await Promise.all([
            supabase.from('profiles').select('name').eq('id', apt.client_id).single(),
            supabase.from('profiles').select('name').eq('id', apt.professional_id).single()
          ]);
          
          return {
            ...apt,
            client_name: clientData.data?.name,
            professional_name: professionalData.data?.name,
            service_name: apt.services?.name,
            service_duration: apt.services?.duration_minutes,
            service_price: apt.services?.base_price
          };
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
    client_id: string;
    professional_id: string;
    service_id: string;
    start_time: string;
    notes?: string;
  }) => {
    if (!profile?.salon_id) return { error: 'Salon ID não encontrado' };

    try {
      // Get service duration to calculate end_time
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', appointmentData.service_id)
        .single();

      if (serviceError) throw serviceError;

      const startTime = new Date(appointmentData.start_time);
      const endTime = new Date(startTime.getTime() + (service.duration_minutes * 60000));

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          ...appointmentData,
          salon_id: profile.salon_id,
          end_time: endTime.toISOString(),
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
    if (profile?.salon_id) {
      fetchAppointments();
    }
  }, [profile?.salon_id]);

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments
  };
}