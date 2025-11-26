import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientes } from './useClientes';
import { EmailService } from '@/services/emailService';
import { AgendamentoEmailData } from '@/settings/email.config';
import { recalcularComissoesMensais } from '@/utils/commissionUtils';

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
  const queryClient = useQueryClient();
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
          funcionario:employees!appointment_requests_funcionario_id_fkey(nome, email, telefone),
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
        const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client`;
        // Criar cliente usando a Edge Function create-client
        try {
          const response = await fetch(functionsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              name: data.cliente_nome,
              email: data.cliente_email,
              phone: data.cliente_telefone || 'Não informado',
              salon_id: data.salao_id,
              observacoes: data.observacoes || ''
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar cliente');
          }

          const result = await response.json();
          temporaryPassword = result.password;
          
        } catch (clientError: any) {
          console.error('❌ Erro ao criar cliente via Edge Function:', clientError);
          
          // Se o erro for "email já registrado", isso é OK - o cliente já existe
          const errorMessage = clientError?.message || '';
          if (errorMessage.includes('already been registered') || 
              errorMessage.includes('already exists') ||
              errorMessage.includes('já está registrado')) {
            console.log('ℹ️ Cliente já existe, continuando sem criar novo...');
            // Continuar normalmente - o cliente já existe
          } else {
            // Para outros erros, logar mas continuar
            console.warn('⚠️ Erro ao criar cliente, mas continuando com a solicitação...');
          }
          // Sempre continuar - não bloquear a criação da solicitação
        }
      }

      // Log dos dados sendo enviados para debug
      console.log('📤 Criando solicitação com dados:', {
        salao_id: data.salao_id,
        servico_id: data.servico_id,
        funcionario_id: data.funcionario_id,
        data_hora: data.data_hora,
        cliente_nome: data.cliente_nome,
        cliente_email: data.cliente_email,
        status: data.status
      });
      
      // SOLUÇÃO ALTERNATIVA: Inserir SEM select, depois buscar
      // Isso evita problema com RLS no SELECT durante INSERT
      const { data: insertedRequest, error: insertError } = await supabase
        .from('appointment_requests')
        .insert([data])
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar solicitação:', insertError);
        console.error('❌ Dados que causaram o erro:', data);
        throw insertError;
      }

      // Agora buscar o registro com os joins (como autenticado ou com política correta)
      const { data: request, error } = await supabase
        .from('appointment_requests')
        .select(`
          *,
          servico:services(nome, duracao_minutos, preco),
          funcionario:employees(nome, email, telefone)
        `)
        .eq('id', insertedRequest.id)
        .single();

      if (error) {
        console.error('❌ Erro ao criar solicitação:', error);
        console.error('❌ Dados que causaram o erro:', data);
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
          
          // Se um novo cliente foi criado, enviar email com credenciais
          if (temporaryPassword) {
            await emailService.enviarConfirmacaoAgendamentoComCredenciais(emailData, temporaryPassword);
          } else {
            await emailService.enviarConfirmacaoAgendamento(emailData);
          }
        } catch (emailError) {
          console.error('Erro ao enviar email de confirmação da solicitação:', emailError);
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

      // Normalizar horário para horário cheio (remover minutos fracionados)
      // IMPORTANTE: Usar Date.UTC() para manter o mesmo horário sem conversão de timezone
      const normalizeTimeToFullHour = (dateTimeString: string): string => {
        const date = new Date(dateTimeString);
        // Usar UTC para não alterar o timezone ao normalizar
        const normalizedDate = new Date(Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          date.getUTCHours(), // Manter a hora UTC original
          0, // Zerar minutos
          0, // Zerar segundos
          0  // Zerar milissegundos
        ));
        return normalizedDate.toISOString();
      };

      // Criar agendamento
      const appointmentData = {
        salao_id: request.salao_id,
        cliente_id: null, // Será preenchido depois se necessário
        funcionario_id: request.funcionario_id,
        employee_id: request.funcionario_id, // Campo duplicado para compatibilidade
        servico_id: request.servico_id,
        data_hora: normalizeTimeToFullHour(request.data_hora), // Normalizar para horário cheio
        status: 'confirmado',
        observacoes: request.observacoes,
        // Campos diretos do cliente
        cliente_nome: request.cliente_nome,
        cliente_telefone: request.cliente_telefone,
        cliente_email: request.cliente_email
      };

      // Criar agendamento na tabela appointments
      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar agendamento:', createError);
        throw createError;
      }

      // Atualizar o status da solicitação para 'aprovado'
      const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({
          status: 'aprovado',
          aprovado_por: aprovadoPor,
          aprovado_em: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Erro ao atualizar status do agendamento:', updateError);
        throw updateError;
      }


      // Invalidar cache dos agendamentos para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ['appointment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });

      // Recalcular comissões se o agendamento for concluído
      if (request.funcionario_id && request.status === 'concluido') {
        const appointmentDate = new Date(request.data_hora);
        const mes = appointmentDate.getMonth() + 1;
        const ano = appointmentDate.getFullYear();
        await recalcularComissoesMensais(request.funcionario_id, mes, ano);
      }


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
      } catch (emailError) {
        console.error('Erro ao enviar email de aprovação:', emailError);
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
            funcionario:employees!inner(nome, email, telefone)
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
        }
      } catch (emailError) {
        console.error('Erro ao enviar email de rejeição:', emailError);
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