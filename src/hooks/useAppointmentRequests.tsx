import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientes } from './useClientes';
import { EmailService } from '@/services/emailService';
import { AgendamentoEmailData } from '@/settings/email.config';

export interface AppointmentRequest {
  id: string;
  salao_id: string;
  servico_id: string;
  funcionario_id?: string;
  data_hora: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string;
  observacoes?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  motivo_rejeicao?: string;
  aprovado_por?: string;
  aprovado_em?: string;
  appointment_id?: string;
  criado_em: string;
  atualizado_em: string;
  // Dados relacionados
  servico?: {
    nome: string;
    duracao_minutos: number;
    preco: number;
  };
  funcionario?: {
    nome: string;
  };
  aprovado_por_user?: {
    nome: string;
  };
}

export interface CreateAppointmentRequestData {
  salao_id: string;
  servico_id: string;
  funcionario_id?: string;
  data_hora: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string;
  observacoes?: string;
}

// Resultado esperado pelo front: request + senha temporária opcional
export interface CreateAppointmentRequestResult {
  request: AppointmentRequest;
  senhaTemporaria?: string;
}

export const useAppointmentRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { checkClienteExists, createCliente } = useClientes();
  const emailService = new EmailService();

  // Buscar solicitações de agendamento
  const fetchAppointmentRequests = async (salaoId: string): Promise<AppointmentRequest[]> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('appointment_requests')
        .select(`
          *,
          servico:services(nome, duracao_minutos, preco),
          funcionario:employees(nome),
          aprovado_por_user:users(nome)
        `)
        .eq('salao_id', salaoId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Criar nova solicitação de agendamento
  const createAppointmentRequest = async (data: CreateAppointmentRequestData): Promise<CreateAppointmentRequestResult> => {
    try {
      setIsLoading(true);
      
      // Verificar se o cliente já existe
      const clienteExists = await checkClienteExists(data.salao_id, data.cliente_email || '');
      
      let temporaryPassword: string | undefined;
      if (!clienteExists && data.cliente_email) {
        // Criar cliente se não existir com senha temporária e defaults seguros
        temporaryPassword = Math.floor(100000 + Math.random() * 900000).toString();
        await createCliente({
          salao_id: data.salao_id,
          nome: data.cliente_nome,
          email: data.cliente_email,
          telefone: data.cliente_telefone || 'Não informado',
          senha_hash: temporaryPassword
        });
      }

      const { data: request, error } = await supabase
        .from('appointment_requests')
        .insert([data])
        .select(`
          *,
          servico:services(nome, duracao_minutos, preco),
          funcionario:employees(nome)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar solicitação:', error);
        throw error;
      }

      // Enviar email de confirmação da solicitação para o cliente (se tiver email)
      if (data.cliente_email) {
        try {
          const emailData: AgendamentoEmailData = {
            cliente_nome: data.cliente_nome,
            cliente_email: data.cliente_email,
            servico_nome: request.servico?.nome || 'Serviço',
            funcionario_nome: request.funcionario?.nome || 'Profissional',
            data_hora: data.data_hora,
            preco: request.servico?.preco || 0,
            duracao_minutos: request.servico?.duracao_minutos || 60,
            observacoes: data.observacoes
          };
          
          await emailService.enviarConfirmacaoAgendamento(emailData);
          console.log('✅ Email de confirmação da solicitação enviado com sucesso');
        } catch (emailError) {
          console.error('❌ Erro ao enviar email de confirmação da solicitação:', emailError);
          // Não falhar a operação principal por erro de email
        }
      }

      return temporaryPassword
        ? { request, senhaTemporaria: temporaryPassword }
        : { request };
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Aprovar solicitação de agendamento
  const approveAppointmentRequest = async (requestId: string, aprovadoPor: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Validações de entrada
      if (!requestId || requestId.trim() === '') {
        throw new Error('ID da solicitação é obrigatório');
      }
      if (!aprovadoPor || aprovadoPor.trim() === '') {
        throw new Error('ID do usuário que aprovou é obrigatório');
      }
      
      // Buscar dados da solicitação
      const { data: request, error: fetchError } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Criar agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          salao_id: request.salao_id,
          cliente_id: null, // Será preenchido depois se necessário
          funcionario_id: request.funcionario_id,
          servico_id: request.servico_id,
          data_hora: request.data_hora,
          status: 'confirmado',
          observacoes: request.observacoes,
          // Campos diretos do cliente
          cliente_nome: request.cliente_nome,
          cliente_telefone: request.cliente_telefone,
          cliente_email: request.cliente_email
        }])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Atualizar solicitação como aprovada e vincular ao agendamento criado
      const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({
          status: 'aprovado',
          aprovado_por: aprovadoPor,
          aprovado_em: new Date().toISOString(),
          appointment_id: appointment.id // Vincular o agendamento criado
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Enviar email de confirmação para o cliente
      try {
        const emailData: AgendamentoEmailData = {
          cliente_nome: request.cliente_nome,
          cliente_email: request.cliente_email || '',
          servico_nome: request.servico?.nome || 'Serviço',
          funcionario_nome: request.funcionario?.nome || 'Profissional',
          data_hora: request.data_hora,
          preco: request.servico?.preco || 0,
          duracao_minutos: request.servico?.duracao_minutos || 60,
          observacoes: request.observacoes
        };
        
        await emailService.enviarAprovacaoAgendamento(emailData);
        console.log('✅ Email de aprovação enviado com sucesso');
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de aprovação:', emailError);
        // Não falhar a operação principal por erro de email
      }

      return true;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Rejeitar solicitação de agendamento
  const rejectAppointmentRequest = async (requestId: string, motivoRejeicao: string, rejeitadoPor: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Validações de entrada
      if (!requestId || requestId.trim() === '') {
        throw new Error('ID da solicitação é obrigatório');
      }
      if (!motivoRejeicao || motivoRejeicao.trim() === '') {
        throw new Error('Motivo da rejeição é obrigatório');
      }
      if (!rejeitadoPor || rejeitadoPor.trim() === '') {
        throw new Error('ID do usuário que rejeitou é obrigatório');
      }
      
      const { error } = await supabase
        .from('appointment_requests')
        .update({
          status: 'rejeitado',
          motivo_rejeicao: motivoRejeicao,
          aprovado_por: rejeitadoPor,
          aprovado_em: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Enviar email de rejeição para o cliente
      try {
        // Buscar dados completos da solicitação para o email
        const { data: requestData } = await supabase
          .from('appointment_requests')
          .select(`
            *,
            servico:services(nome, duracao_minutos, preco),
            funcionario:employees(nome)
          `)
          .eq('id', requestId)
          .single();

        if (requestData) {
          const emailData: AgendamentoEmailData = {
            cliente_nome: requestData.cliente_nome,
            cliente_email: requestData.cliente_email || '',
            servico_nome: requestData.servico?.nome || 'Serviço',
            funcionario_nome: requestData.funcionario?.nome || 'Profissional',
            data_hora: requestData.data_hora,
            preco: requestData.servico?.preco || 0,
            duracao_minutos: requestData.servico?.duracao_minutos || 60,
            observacoes: requestData.observacoes,
            motivo_rejeicao: motivoRejeicao
          };
          
          await emailService.enviarRejeicaoAgendamento(emailData);
          console.log('✅ Email de rejeição enviado com sucesso');
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de rejeição:', emailError);
        // Não falhar a operação principal por erro de email
      }

      return true;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar solicitação de agendamento
  const deleteAppointmentRequest = async (requestId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('appointment_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar solicitação:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fetchAppointmentRequests,
    createAppointmentRequest,
    approveAppointmentRequest,
    rejectAppointmentRequest,
    deleteAppointmentRequest
  };
};