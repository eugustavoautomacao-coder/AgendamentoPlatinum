import { supabase } from '@/integrations/supabase/client';

/**
 * Recalcula as comissões mensais para um funcionário específico
 * 
 * REGRA SIMPLES:
 * - percentual_comissao > 0 → calcula
 * - percentual_comissao = 0 ou NULL → não calcula
 */
export const recalcularComissoesMensais = async (funcionarioId: string, mes: number, ano: number) => {
  try {
    // Buscar dados do funcionário
    const { data: funcionario, error: funcionarioError } = await supabase
      .from('employees')
      .select('salao_id, percentual_comissao, nome')
      .eq('id', funcionarioId)
      .single();

    if (funcionarioError || !funcionario) return;

    // Se comissão = 0%, não calcular
    if (!funcionario.percentual_comissao || funcionario.percentual_comissao <= 0) {
      return;
    }

    // Período do mês
    const startDate = `${ano}-${mes.toString().padStart(2, '0')}-01`;
    const endDate = `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`;

    // Buscar agendamentos concluídos do mês (funcionario_id OU employee_id)
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('appointments')
      .select(`
        id,
        servico_id,
        services!inner(preco)
      `)
      .or(`funcionario_id.eq.${funcionarioId},employee_id.eq.${funcionarioId}`)
      .eq('status', 'concluido')
      .gte('data_hora', startDate)
      .lt('data_hora', endDate);

    if (agendamentosError || !agendamentos) return;

    const totalServicos = agendamentos.reduce((sum, apt) => sum + (apt.services?.preco || 0), 0);
    const totalAgendamentos = agendamentos.length;
    const valorComissaoTotal = totalServicos * (funcionario.percentual_comissao / 100);

    // Se não há agendamentos, não criar comissão
    if (totalAgendamentos === 0) return;

    // Verificar se já existe comissão mensal
    const { data: comissaoExistente, error: comissaoError } = await supabase
      .from('comissoes_mensais')
      .select('id, valor_pago')
      .eq('funcionario_id', funcionarioId)
      .eq('mes', mes)
      .eq('ano', ano)
      .single();

    if (comissaoError && comissaoError.code !== 'PGRST116') return;

    if (comissaoExistente) {
      // Atualizar comissão existente
      const saldoPendente = valorComissaoTotal - comissaoExistente.valor_pago;
      const status = saldoPendente <= 0 ? 'pago' : 'aberto';

      await supabase
        .from('comissoes_mensais')
        .update({
          total_agendamentos: totalAgendamentos,
          total_servicos: totalServicos,
          base_calculo_total: totalServicos, // Base = total dos serviços
          percentual_comissao: funcionario.percentual_comissao,
          valor_comissao_total: valorComissaoTotal,
          saldo_pendente: saldoPendente,
          status: status,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', comissaoExistente.id);

      // Limpar e recriar detalhes
      await supabase
        .from('comissoes_agendamentos_detalhes')
        .delete()
        .eq('comissao_mensal_id', comissaoExistente.id);

      if (agendamentos.length > 0) {
        const detalhes = agendamentos.map(apt => ({
          comissao_mensal_id: comissaoExistente.id,
          appointment_id: apt.id,
          valor_servico: apt.services?.preco || 0,
          taxa_custo: 0,
          base_calculo: apt.services?.preco || 0,
          valor_comissao: (apt.services?.preco || 0) * (funcionario.percentual_comissao / 100)
        }));

        await supabase
          .from('comissoes_agendamentos_detalhes')
          .insert(detalhes);
      }
    } else {
      // Criar nova comissão mensal
      const { data: novaComissao, error: insertError } = await supabase
        .from('comissoes_mensais')
        .insert({
          salao_id: funcionario.salao_id,
          funcionario_id: funcionarioId,
          mes: mes,
          ano: ano,
          total_agendamentos: totalAgendamentos,
          total_servicos: totalServicos,
          base_calculo_total: totalServicos, // Base = total dos serviços
          percentual_comissao: funcionario.percentual_comissao,
          valor_comissao_total: valorComissaoTotal,
          saldo_pendente: valorComissaoTotal,
          status: 'aberto'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (agendamentos.length > 0 && novaComissao) {
        const detalhes = agendamentos.map(apt => ({
          comissao_mensal_id: novaComissao.id,
          appointment_id: apt.id,
          valor_servico: apt.services?.preco || 0,
          taxa_custo: 0,
          base_calculo: apt.services?.preco || 0,
          valor_comissao: (apt.services?.preco || 0) * (funcionario.percentual_comissao / 100)
        }));

        await supabase
          .from('comissoes_agendamentos_detalhes')
          .insert(detalhes);
      }
    }
  } catch (error) {
    console.error('Erro ao recalcular comissões:', error);
    throw error;
  }
};
