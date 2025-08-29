import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useAppointmentRequests = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAppointmentRequests = async (salaoId: string): Promise<AppointmentRequest[]> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('appointment_requests')
        .select(`
          *,
          servico:services(nome, duracao_minutos, preco),
          funcionario:employees(nome),
          aprovado_por_user:users!aprovado_por(nome)
        `)
        .eq('salao_id', salaoId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointmentRequest = async (data: CreateAppointmentRequestData): Promise<AppointmentRequest | null> => {
    try {
      setIsLoading(true);
      
      const { data: result, error } = await supabase
        .from('appointment_requests')
        .insert([data])
        .select(`
          *,
          servico:services(nome, duracao_minutos, preco),
          funcionario:employees(nome)
        `)
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const approveAppointmentRequest = async (requestId: string, userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
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
          servico_id: request.servico_id,
          funcionario_id: request.funcionario_id,
          data_hora: request.data_hora,
          status: 'confirmado',
          observacoes: request.observacoes,
          cliente_nome: request.cliente_nome,
          cliente_telefone: request.cliente_telefone,
          cliente_email: request.cliente_email
        }])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Atualizar solicitação como aprovada
      const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({
          status: 'aprovado',
          aprovado_por: userId,
          aprovado_em: new Date().toISOString(),
          appointment_id: appointment.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectAppointmentRequest = async (requestId: string, userId: string, motivo: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('appointment_requests')
        .update({
          status: 'rejeitado',
          aprovado_por: userId,
          aprovado_em: new Date().toISOString(),
          motivo_rejeicao: motivo
        })
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

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
