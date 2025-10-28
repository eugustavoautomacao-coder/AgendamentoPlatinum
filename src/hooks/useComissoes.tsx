import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ComissaoMensal {
  id: string;
  salao_id: string;
  funcionario_id: string;
  funcionario_nome: string;
  funcionario_avatar?: string;
  mes: number;
  ano: number;
  total_agendamentos: number;
  total_servicos: number;
  percentual_comissao: number;
  valor_comissao_total: number;
  valor_pago: number;
  saldo_pendente: number;
  status: 'aberto' | 'pago';
  criado_em: string;
  atualizado_em: string;
}

export interface ComissaoDetalhe {
  id: string;
  comissao_mensal_id: string;
  appointment_id: string;
  valor_servico: number;
  taxa_custo: number;
  base_calculo: number;
  valor_comissao: number;
  // Dados relacionados
  cliente_nome?: string;
  servico_nome?: string;
  data_agendamento?: string;
}

export function useComissoes(funcionarioId?: string) {
  const [comissoesMensais, setComissoesMensais] = useState<ComissaoMensal[]>([]);
  const [detalhesComissao, setDetalhesComissao] = useState<ComissaoDetalhe[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar comissões mensais do profissional
  const fetchComissoesMensais = async () => {
    if (!funcionarioId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comissoes_mensais')
        .select(`
          *,
          employees!inner(
            nome,
            user_id,
            users!inner(avatar_url)
          )
        `)
        .eq('funcionario_id', funcionarioId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (error) throw error;

      const comissoesFormatadas = data?.map(comissao => ({
        ...comissao,
        funcionario_nome: comissao.employees?.nome || 'N/A',
        funcionario_avatar: comissao.employees?.users?.avatar_url || null
      })) || [];

      setComissoesMensais(comissoesFormatadas);
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  };

  // Buscar detalhes de uma comissão específica
  const fetchDetalhesComissao = async (comissaoId: string) => {
    try {
      const { data, error } = await supabase
        .from('comissoes_agendamentos_detalhes')
        .select(`
          *,
          appointments!inner(
            cliente_nome,
            data_hora,
            services!inner(nome)
          )
        `)
        .eq('comissao_mensal_id', comissaoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const detalhesFormatados = data?.map(detalhe => ({
        ...detalhe,
        cliente_nome: detalhe.appointments?.cliente_nome,
        servico_nome: detalhe.appointments?.services?.nome,
        data_agendamento: detalhe.appointments?.data_hora
      })) || [];

      setDetalhesComissao(detalhesFormatados);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast.error("Erro ao carregar detalhes da comissão");
    }
  };

  // Recalcular comissões para um funcionário específico
  const recalcularComissoes = async (funcionarioId: string, mes: number, ano: number) => {
    try {
      const { error } = await supabase.rpc('recalcular_comissoes_mensais', {
        p_funcionario_id: funcionarioId,
        p_mes: mes,
        p_ano: ano
      });

      if (error) throw error;

      toast.success("Comissões recalculadas com sucesso");
      await fetchComissoesMensais();
    } catch (error) {
      console.error('Erro ao recalcular comissões:', error);
      toast.error("Erro ao recalcular comissões");
    }
  };

  // Registrar pagamento de comissão
  const registrarPagamento = async (
    comissaoId: string,
    valorPago: number,
    formaPagamento: string = 'PIX',
    observacoes?: string
  ) => {
    try {
      const { error } = await supabase.rpc('registrar_pagamento_comissao', {
        p_comissao_mensal_id: comissaoId,
        p_valor_pago: valorPago,
        p_forma_pagamento: formaPagamento,
        p_observacoes: observacoes
      });

      if (error) throw error;

      toast.success("Pagamento registrado com sucesso");
      await fetchComissoesMensais();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error("Erro ao registrar pagamento");
    }
  };

  useEffect(() => {
    if (funcionarioId) {
      fetchComissoesMensais();
    }
  }, [funcionarioId]);

  return {
    comissoesMensais,
    detalhesComissao,
    loading,
    fetchComissoesMensais,
    fetchDetalhesComissao,
    recalcularComissoes,
    registrarPagamento
  };
}
