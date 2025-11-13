import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { monitorQueryPerformance } from '@/utils/performanceMonitor';
import { fetchCachedWithPagination, invalidatePaginationCache } from '@/utils/queryOptimization';
import { env } from '@/config/env';

export interface ComissaoMensal {
  id: string;
  salao_id: string;
  funcionario_id: string;
  funcionario_nome: string;
  mes: number;
  ano: number;
  total_agendamentos: number;
  total_servicos: number;
  percentual_comissao: number;
  valor_comissao_total: number;
  valor_pago: number;
  saldo_pendente: number;
  status: string;
  criado_em: string;
  atualizado_em: string;
}

export function useOptimizedCommissions() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query otimizada para buscar comissões
  const {
    data: comissoes,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['optimized-commissions', profile?.salao_id],
    queryFn: async (): Promise<ComissaoMensal[]> => {
      if (!profile?.salao_id) return [];

      return await monitorQueryPerformance('fetchCommissions', async () => {
        const { data, error } = await supabase
          .from('comissoes_mensais')
          .select(`
            *,
            funcionario:employees!funcionario_id(nome)
          `)
          .eq('salao_id', profile.salao_id)
          .order('ano', { ascending: false })
          .order('mes', { ascending: false });

        if (error) throw error;

        return data?.map(comissao => ({
          ...comissao,
          funcionario_nome: comissao.funcionario?.nome || 'Funcionário não encontrado',
        })) || [];
      });
    },
    enabled: !!profile?.salao_id,
    staleTime: env.CACHE_TTL * 1000, // Usar TTL configurável
    refetchOnWindowFocus: false,
  });

  // Mutation otimizada para registrar pagamento
  const registerPaymentMutation = useMutation({
    mutationFn: async ({ comissaoId, valorPago }: { comissaoId: string; valorPago: number }) => {
      return await monitorQueryPerformance('registerPayment', async () => {
        // Buscar comissão atual
        const { data: comissao, error: comissaoError } = await supabase
          .from('comissoes_mensais')
          .select('*')
          .eq('id', comissaoId)
          .single();

        if (comissaoError) throw comissaoError;

        const novoValorPago = comissao.valor_pago + valorPago;
        const novoSaldoPendente = comissao.valor_comissao_total - novoValorPago;
        const novoStatus = novoSaldoPendente <= 0 ? 'pago' : 'aberto';

        // Atualizar comissão
        const { error: updateError } = await supabase
          .from('comissoes_mensais')
          .update({
            valor_pago: novoValorPago,
            saldo_pendente: novoSaldoPendente,
            status: novoStatus,
            atualizado_em: new Date().toISOString()
          })
          .eq('id', comissaoId);

        if (updateError) throw updateError;

        // Inserir registro de pagamento
        const { error: insertError } = await supabase
          .from('pagamentos_comissoes')
          .insert({
            comissao_mensal_id: comissaoId,
            valor_pago: valorPago,
            data_pagamento: new Date().toISOString(),
            metodo_pagamento: 'transferencia',
            observacoes: 'Pagamento registrado via sistema'
          });

        if (insertError) throw insertError;

        return { comissaoId, novoValorPago, novoSaldoPendente, novoStatus };
      });
    },
    onSuccess: () => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['optimized-commissions'] });
      invalidatePaginationCache('commissions');
    },
  });

  // Função para buscar detalhes com paginação
  const fetchCommissionDetails = async (comissaoId: string, page: number = 1) => {
    return await fetchCachedWithPagination(
      `commission-details:${comissaoId}`,
      'comissoes_agendamentos_detalhes',
      { comissao_mensal_id: comissaoId },
      page,
      env.PAGE_SIZE,
      env.CACHE_TTL
    );
  };

  // Função para recalcular comissões
  const recalculateCommissions = async (funcionarioId: string, mes: number, ano: number) => {
    return await monitorQueryPerformance('recalculateCommissions', async () => {
      // Implementar lógica de recálculo
      // ... (código existente)
    });
  };

  useEffect(() => {
    setLoading(isLoading);
    setError(queryError?.message || null);
  }, [isLoading, queryError]);

  return {
    comissoes: comissoes || [],
    loading,
    error,
    refetch,
    registerPayment: registerPaymentMutation.mutateAsync,
    fetchCommissionDetails,
    recalculateCommissions,
  };
}
