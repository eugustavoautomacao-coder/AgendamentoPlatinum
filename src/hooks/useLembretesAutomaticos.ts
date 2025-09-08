import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmailService } from '@/services/emailService';
import { AgendamentoEmailData } from '@/settings/email.config';

interface LembreteConfig {
  enabled: boolean;
  intervalMinutes: number; // Verificar a cada X minutos
  reminderHours: number[]; // Horas antes do agendamento para enviar lembrete (ex: [24, 2])
}

export const useLembretesAutomaticos = (config: LembreteConfig = {
  enabled: true,
  intervalMinutes: 30,
  reminderHours: [24, 2] // 24h e 2h antes
}) => {
  const emailService = useRef(new EmailService());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar agendamentos que precisam de lembrete
  const verificarLembretes = useCallback(async () => {
    if (!config.enabled) return;

    try {
      const agora = new Date();
      
      // Buscar agendamentos confirmados para hoje e amanhã
      const { data: agendamentos, error } = await supabase
        .from('appointments')
        .select(`
          *,
          servico:services(nome, duracao_minutos, preco),
          funcionario:employees!appointments_funcionario_id_fkey(nome, email, telefone)
        `)
        .eq('status', 'confirmado')
        .gte('data_hora', agora.toISOString())
        .lte('data_hora', new Date(agora.getTime() + 48 * 60 * 60 * 1000).toISOString()); // Próximas 48h

      if (error) {
        console.error('Erro ao buscar agendamentos para lembretes:', error);
        return;
      }

      if (!agendamentos) return;

      // Verificar cada agendamento
      for (const agendamento of agendamentos) {
        const dataHora = new Date(agendamento.data_hora);
        const diffHours = (dataHora.getTime() - agora.getTime()) / (1000 * 60 * 60);

        // Verificar se está no momento de enviar lembrete
        for (const reminderHour of config.reminderHours) {
          if (diffHours <= reminderHour && diffHours > reminderHour - 1) {
            // Verificar se já foi enviado lembrete para este horário
            const lembreteKey = `lembrete_${agendamento.id}_${reminderHour}h`;
            const lembreteEnviado = localStorage.getItem(lembreteKey);
            
            if (!lembreteEnviado) {
              await enviarLembrete(agendamento, reminderHour);
              // Marcar como enviado
              localStorage.setItem(lembreteKey, 'true');
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar lembretes:', error);
    }
  }, [config.enabled, config.reminderHours]);

  // Enviar lembrete específico
  const enviarLembrete = useCallback(async (agendamento: any, horasAntes: number) => {
    try {
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

      await emailService.current.enviarLembreteAgendamento(emailData);
      console.log(`✅ Lembrete de ${horasAntes}h enviado para ${agendamento.cliente_nome}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar lembrete de ${horasAntes}h:`, error);
    }
  }, []);

  // Iniciar sistema de lembretes
  const iniciarLembretes = useCallback(() => {
    if (!config.enabled) return;

    // Verificar imediatamente
    verificarLembretes();

    // Configurar intervalo
    intervalRef.current = setInterval(verificarLembretes, config.intervalMinutes * 60 * 1000);

    console.log(`🚀 Sistema de lembretes iniciado - verificando a cada ${config.intervalMinutes} minutos`);
  }, [config.enabled, config.intervalMinutes, verificarLembretes]);

  // Parar sistema de lembretes
  const pararLembretes = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ Sistema de lembretes parado');
    }
  }, []);

  // Limpar lembretes enviados (útil para testes)
  const limparLembretesEnviados = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('lembrete_'));
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Lembretes enviados limpos');
  }, []);

  // Iniciar automaticamente quando o hook é montado
  useEffect(() => {
    iniciarLembretes();
    
    // Cleanup ao desmontar
    return () => {
      pararLembretes();
    };
  }, [iniciarLembretes, pararLembretes]);

  return {
    iniciarLembretes,
    pararLembretes,
    verificarLembretes,
    enviarLembrete,
    limparLembretesEnviados
  };
};
