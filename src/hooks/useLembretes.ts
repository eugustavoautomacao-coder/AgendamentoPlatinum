import { useCallback, useEffect, useRef } from 'react';
import { EmailService } from '@/services/emailService';
import { AgendamentoEmailData } from '@/settings/email.config';

interface LembreteConfig {
  enabled: boolean;
  lembrete24h: boolean;
  lembrete2h: boolean;
  lembrete1h: boolean;
}

export const useLembretes = (config: LembreteConfig = {
  enabled: true,
  lembrete24h: true,
  lembrete2h: true,
  lembrete1h: false
}) => {
  const emailService = useRef(new EmailService());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verificar se um agendamento precisa de lembrete
  const verificarLembretes = useCallback(async (agendamentos: any[]) => {
    if (!config.enabled) return;
    
    const agora = new Date();
    const agendamentosComLembrete = agendamentos.filter(ag => {
      const dataAgendamento = new Date(ag.data_hora);
      const diffHoras = (dataAgendamento.getTime() - agora.getTime()) / (1000 * 60 * 60);
      
      // Lembrete 24h antes
      if (config.lembrete24h && diffHoras >= 23 && diffHoras <= 25) {
        return { tipo: '24h', agendamento: ag };
      }
      
      // Lembrete 2h antes
      if (config.lembrete2h && diffHoras >= 1.5 && diffHoras <= 2.5) {
        return { tipo: '2h', agendamento: ag };
      }
      
      // Lembrete 1h antes
      if (config.lembrete1h && diffHoras >= 0.5 && diffHoras <= 1.5) {
        return { tipo: '1h', agendamento: ag };
      }
      
      return null;
    }).filter(Boolean);
    
    // Enviar lembretes
    for (const item of agendamentosComLembrete) {
      if (item) {
        await enviarLembrete(item.agendamento, item.tipo);
      }
    }
  }, [config]);
  
  // Enviar lembrete específico
  const enviarLembrete = useCallback(async (agendamento: any, tipo: string) => {
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
      
      const sucesso = await emailService.current.enviarLembreteAgendamento(emailData);
      
      if (sucesso) {
        console.log(`✅ Lembrete ${tipo} enviado para ${agendamento.cliente_email}`);
        // Aqui você pode marcar no banco que o lembrete foi enviado
        // para evitar reenvios
      } else {
        console.error(`❌ Falha ao enviar lembrete ${tipo} para ${agendamento.cliente_email}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao enviar lembrete ${tipo}:`, error);
    }
  }, []);
  
  // Iniciar sistema de lembretes
  const iniciarLembretes = useCallback((agendamentos: any[]) => {
    if (!config.enabled) return;
    
    // Verificar a cada 5 minutos
    intervalRef.current = setInterval(() => {
      verificarLembretes(agendamentos);
    }, 5 * 60 * 1000);
    
    // Verificação inicial
    verificarLembretes(agendamentos);
  }, [config.enabled, verificarLembretes]);
  
  // Parar sistema de lembretes
  const pararLembretes = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      pararLembretes();
    };
  }, [pararLembretes]);
  
  return {
    iniciarLembretes,
    pararLembretes,
    verificarLembretes,
    enviarLembrete
  };
};
