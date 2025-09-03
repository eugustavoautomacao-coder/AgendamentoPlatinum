import { useCallback } from 'react';
import { EmailService } from '@/services/emailService';
import { AgendamentoEmailData } from '@/settings/email.config';

export const useEmailNotifications = () => {
  const emailService = new EmailService();

  // Email de confirmação da solicitação quando cliente cria agendamento
  const enviarConfirmacaoCriacao = useCallback(async (data: AgendamentoEmailData) => {
    try {
      await emailService.enviarConfirmacaoAgendamento(data);
      console.log('✅ Email de confirmação da solicitação enviado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de confirmação da solicitação:', error);
      return false;
    }
  }, []);

  // Email de aprovação quando admin/profissional aprova
  const enviarAprovacao = useCallback(async (data: AgendamentoEmailData) => {
    try {
      await emailService.enviarAprovacaoAgendamento(data);
      console.log('✅ Email de aprovação enviado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de aprovação:', error);
      return false;
    }
  }, []);

  // Email de rejeição quando admin/profissional rejeita
  const enviarRejeicao = useCallback(async (data: AgendamentoEmailData) => {
    try {
      await emailService.enviarRejeicaoAgendamento(data);
      console.log('✅ Email de rejeição enviado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de rejeição:', error);
      return false;
    }
  }, []);

  // Email de cancelamento quando cliente cancela
  const enviarCancelamento = useCallback(async (data: AgendamentoEmailData) => {
    try {
      await emailService.enviarCancelamentoAgendamento(data);
      console.log('✅ Email de cancelamento enviado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de cancelamento:', error);
      return false;
    }
  }, []);

  // Email de lembrete (para agendamentos confirmados)
  const enviarLembrete = useCallback(async (data: AgendamentoEmailData) => {
    try {
      await emailService.enviarLembreteAgendamento(data);
      console.log('✅ Email de lembrete enviado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de lembrete:', error);
      return false;
    }
  }, []);

  // Email de alteração de horário
  const enviarAlteracaoHorario = useCallback(async (data: AgendamentoEmailData, novoHorario: string) => {
    try {
      // Criar dados para email de alteração
      const emailData: AgendamentoEmailData = {
        ...data,
        data_hora: novoHorario,
        observacoes: `Horário alterado para: ${new Date(novoHorario).toLocaleString('pt-BR')}`
      };
      
      await emailService.enviarConfirmacaoAgendamento(emailData);
      console.log('✅ Email de alteração de horário enviado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de alteração:', error);
      return false;
    }
  }, []);

  // Email de reagendamento
  const enviarReagendamento = useCallback(async (data: AgendamentoEmailData, novoHorario: string) => {
    try {
      const emailData: AgendamentoEmailData = {
        ...data,
        data_hora: novoHorario,
        observacoes: `Agendamento reagendado para: ${new Date(novoHorario).toLocaleString('pt-BR')}`
      };
      
      await emailService.enviarConfirmacaoAgendamento(emailData);
      console.log('✅ Email de reagendamento enviado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de reagendamento:', error);
      return false;
    }
  }, []);

  return {
    enviarConfirmacaoCriacao,
    enviarAprovacao,
    enviarRejeicao,
    enviarCancelamento,
    enviarLembrete,
    enviarAlteracaoHorario,
    enviarReagendamento
  };
};
