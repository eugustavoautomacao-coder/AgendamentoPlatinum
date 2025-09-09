import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { cacheWithTTL } from '@/lib/redis';

export interface Appointment {
  id: string;
  salao_id: string;
  cliente_id: string;
  funcionario_id: string;
  servico_id: string;
  data_hora: string;
  status: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  cliente_nome?: string;
  funcionario_nome?: string;
  servico_nome?: string;
  servico_preco?: number;
}

export function useCachedAppointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async (): Promise<Appointment[]> => {
    if (!profile?.salao_id) return [];

    // Usar cache com TTL de 2 minutos
    return await cacheWithTTL(
      `appointments:${profile.salao_id}`,
      async () => {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            cliente:clientes(nome),
            funcionario:employees(nome),
            servico:services(nome, preco)
          `)
          .eq('salao_id', profile.salao_id)
          .order('data_hora', { ascending: false });

        if (error) throw error;

        return data?.map(apt => ({
          ...apt,
          cliente_nome: apt.cliente?.nome,
          funcionario_nome: apt.funcionario?.nome,
          servico_nome: apt.servico?.nome,
          servico_preco: apt.servico?.preco,
        })) || [];
      },
      120 // 2 minutos
    );
  };

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['cached-appointments', profile?.salao_id],
    queryFn: fetchAppointments,
    enabled: !!profile?.salao_id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setAppointments(data);
      setLoading(false);
    }
    if (isLoading) {
      setLoading(true);
    }
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
    }
  }, [data, isLoading, queryError]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
  };
}
