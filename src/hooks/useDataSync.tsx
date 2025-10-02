import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook para sincronização em tempo real de dados
 * Escuta mudanças no banco de dados e invalida queries do React Query
 */
export function useDataSync() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.salao_id) return;

    // Configurar listeners para mudanças em tempo real
    const setupRealtimeListeners = () => {
      // Listener para mudanças em clientes (users com tipo 'cliente')
      const clientsSubscription = supabase
        .channel('clients-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'users',
            filter: `salao_id=eq.${profile.salao_id}`
          },
          (payload) => {
            console.log('Cliente alterado:', payload);
            
            // Invalidar queries relacionadas a clientes
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            
            // Se for uma atualização, invalidar também queries específicas do cliente
            if (payload.eventType === 'UPDATE') {
              queryClient.invalidateQueries({ 
                queryKey: ['client', payload.new.id] 
              });
            }
          }
        )
        .subscribe();

      // Listener para mudanças em agendamentos
      const appointmentsSubscription = supabase
        .channel('appointments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `salao_id=eq.${profile.salao_id}`
          },
          (payload) => {
            console.log('Agendamento alterado:', payload);
            
            // Invalidar queries relacionadas a agendamentos
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            
            // Invalidar também queries específicas do agendamento
            if (payload.eventType === 'UPDATE') {
              queryClient.invalidateQueries({ 
                queryKey: ['appointment', payload.new.id] 
              });
            }
          }
        )
        .subscribe();

      // Listener para mudanças em profissionais (employees)
      const professionalsSubscription = supabase
        .channel('professionals-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employees',
            filter: `salao_id=eq.${profile.salao_id}`
          },
          (payload) => {
            console.log('Profissional alterado:', payload);
            
            // Invalidar queries relacionadas a profissionais
            queryClient.invalidateQueries({ queryKey: ['professionals'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            
            // Se for uma atualização, invalidar também queries específicas do profissional
            if (payload.eventType === 'UPDATE') {
              queryClient.invalidateQueries({ 
                queryKey: ['professional', payload.new.id] 
              });
            }
          }
        )
        .subscribe();

      // Listener para mudanças em serviços
      const servicesSubscription = supabase
        .channel('services-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'services',
            filter: `salao_id=eq.${profile.salao_id}`
          },
          (payload) => {
            console.log('Serviço alterado:', payload);
            
            // Invalidar queries relacionadas a serviços
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            
            // Se for uma atualização, invalidar também queries específicas do serviço
            if (payload.eventType === 'UPDATE') {
              queryClient.invalidateQueries({ 
                queryKey: ['service', payload.new.id] 
              });
            }
          }
        )
        .subscribe();

      // Listener para mudanças em solicitações de agendamento
      const appointmentRequestsSubscription = supabase
        .channel('appointment-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointment_requests',
            filter: `salao_id=eq.${profile.salao_id}`
          },
          (payload) => {
            console.log('Solicitação de agendamento alterada:', payload);
            
            // Invalidar queries relacionadas a solicitações
            queryClient.invalidateQueries({ queryKey: ['appointment-requests'] });
          }
        )
        .subscribe();

      // Retornar função de cleanup
      return () => {
        clientsSubscription.unsubscribe();
        appointmentsSubscription.unsubscribe();
        professionalsSubscription.unsubscribe();
        servicesSubscription.unsubscribe();
        appointmentRequestsSubscription.unsubscribe();
      };
    };

    const cleanup = setupRealtimeListeners();

    // Cleanup quando o componente for desmontado ou o salao_id mudar
    return cleanup;
  }, [profile?.salao_id, queryClient]);

  return null; // Este hook não retorna nada, apenas configura os listeners
}


