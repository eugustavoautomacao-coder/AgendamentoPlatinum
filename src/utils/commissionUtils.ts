import { supabase } from '@/integrations/supabase/client';

/**
 * Recalcula as comissões mensais para um funcionário específico
 * Esta função é chamada automaticamente quando um agendamento é concluído
 */
export const recalcularComissoesMensais = async (funcionarioId: string, mes: number, ano: number) => {
  console.log(`🔄 INICIANDO recálculo para funcionário ${funcionarioId}, mês ${mes}/${ano}`);
  
  try {
    // Buscar dados do funcionário
    const { data: funcionario, error: funcionarioError } = await supabase
      .from('employees')
      .select('salao_id, percentual_comissao, nome, data_inicio_comissao')
      .eq('id', funcionarioId)
      .single();

    console.log('📊 Dados do funcionário:', funcionario);

    if (funcionarioError) {
      console.error('❌ Erro ao buscar funcionário:', funcionarioError);
      return;
    }

    if (!funcionario) {
      console.warn('⚠️ Funcionário não encontrado');
      return;
    }

    // Se o funcionário tem comissão 0%, não criar/atualizar comissão mensal
    if (!funcionario.percentual_comissao || funcionario.percentual_comissao === 0) {
      console.log(`⏭️ ${funcionario.nome} tem comissão 0%, pulando...`);
      return;
    }

    console.log(`✅ ${funcionario.nome} - Comissão: ${funcionario.percentual_comissao}%`);
    
    if (funcionario.data_inicio_comissao) {
      console.log(`📅 Comissão ativa desde: ${new Date(funcionario.data_inicio_comissao).toLocaleString('pt-BR')}`);
    } else {
      console.log('⚠️ Data de início da comissão não definida, considerando todos os agendamentos');
    }

    // Buscar agendamentos concluídos do mês
    const startDate = `${ano}-${mes.toString().padStart(2, '0')}-01`;
    const endDate = `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`;
    
    // Definir data mínima: maior entre startDate e data_inicio_comissao
    let dataMinima = startDate;
    if (funcionario.data_inicio_comissao) {
      const dataInicioComissao = new Date(funcionario.data_inicio_comissao).toISOString();
      // Usar a data mais recente entre o início do mês e o início da comissão
      dataMinima = dataInicioComissao > startDate ? dataInicioComissao : startDate;
      console.log(`✅ TRIGGER FUNCIONOU! data_inicio_comissao existe`);
      console.log(`🔍 Buscando agendamentos de ${new Date(dataMinima).toLocaleString('pt-BR')} até ${new Date(endDate).toLocaleString('pt-BR')}`);
    } else {
      console.log(`⚠️ TRIGGER NÃO FUNCIONOU! data_inicio_comissao é NULL`);
      console.log(`⚠️ Isso significa que a migration NÃO foi aplicada ou o trigger falhou`);
      console.log(`🔍 Buscando agendamentos de ${new Date(startDate).toLocaleString('pt-BR')} até ${new Date(endDate).toLocaleString('pt-BR')}`);
    }
    
    console.log('🔍 QUERY DE AGENDAMENTOS:');
    console.log('  funcionario_id:', funcionarioId);
    console.log('  status:', 'concluido');
    console.log('  data_hora >=', dataMinima);
    console.log('  data_hora <', endDate);

    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('appointments')
      .select(`
        id,
        servico_id,
        data_hora,
        status,
        cliente_nome,
        funcionario_id,
        employee_id,
        services!inner(
          preco,
          nome
        )
      `)
      .eq('funcionario_id', funcionarioId)
      .eq('status', 'concluido')
      .gte('data_hora', dataMinima)
      .lt('data_hora', endDate);

    if (agendamentosError) {
      console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
      return;
    }

    console.log('📦 Resultado da query:', agendamentos);
    console.log('📊 Detalhes dos agendamentos:');
    agendamentos?.forEach((apt, index) => {
      console.log(`  ${index + 1}. ${apt.cliente_nome} - ${apt.services?.nome || 'Sem serviço'} - R$ ${apt.services?.preco || 0} - Status: ${apt.status} - Data: ${new Date(apt.data_hora).toLocaleString('pt-BR')}`);
    });

    const totalServicos = agendamentos?.reduce((sum, apt) => sum + (apt.services?.preco || 0), 0) || 0;
    const totalAgendamentos = agendamentos?.length || 0;
    const valorComissaoTotal = totalServicos * (funcionario.percentual_comissao / 100);

    console.log(`📋 Agendamentos encontrados: ${totalAgendamentos}`);
    console.log(`💰 Total serviços: R$ ${totalServicos.toFixed(2)}`);
    console.log(`💵 Valor comissão: R$ ${valorComissaoTotal.toFixed(2)}`);

    // Se não há agendamentos, não criar comissão vazia
    if (totalAgendamentos === 0 || totalServicos === 0) {
      console.log(`⚠️ ${funcionario.nome} não tem agendamentos concluídos em ${mes}/${ano}`);
      return;
    }

    // Verificar se já existe comissão mensal
    const { data: comissaoExistente, error: comissaoError } = await supabase
      .from('comissoes_mensais')
      .select('id, valor_pago')
      .eq('funcionario_id', funcionarioId)
      .eq('mes', mes)
      .eq('ano', ano)
      .single();

    if (comissaoError && comissaoError.code !== 'PGRST116') return; // PGRST116 = no rows returned

    if (comissaoExistente) {
      console.log('🔄 Atualizando comissão existente...');
      
      // Atualizar comissão existente
      const saldoPendente = valorComissaoTotal - comissaoExistente.valor_pago;
      const status = saldoPendente <= 0 ? 'pago' : 'aberto';

      const { error: updateError } = await supabase
        .from('comissoes_mensais')
        .update({
          total_agendamentos: totalAgendamentos,
          total_servicos: totalServicos,
          percentual_comissao: funcionario.percentual_comissao, // Atualizar percentual
          valor_comissao_total: valorComissaoTotal,
          saldo_pendente: saldoPendente,
          status: status,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', comissaoExistente.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar comissão:', updateError);
      } else {
        console.log('✅ Comissão atualizada com sucesso!');
      }

      // Limpar e recriar detalhes dos agendamentos
      await supabase
        .from('comissoes_agendamentos_detalhes')
        .delete()
        .eq('comissao_mensal_id', comissaoExistente.id);

      // Inserir novos detalhes
      if (agendamentos && agendamentos.length > 0) {
        const detalhes = agendamentos.map(apt => ({
          comissao_mensal_id: comissaoExistente.id,
          appointment_id: apt.id,
          valor_servico: apt.services?.preco || 0,
          taxa_custo: 0, // Por enquanto 0, pode ser implementado depois
          base_calculo: apt.services?.preco || 0,
          valor_comissao: (apt.services?.preco || 0) * (funcionario.percentual_comissao / 100)
        }));

        await supabase
          .from('comissoes_agendamentos_detalhes')
          .insert(detalhes);
      }
    } else {
      console.log('✨ Criando NOVA comissão mensal...');
      
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
          percentual_comissao: funcionario.percentual_comissao,
          valor_comissao_total: valorComissaoTotal,
          saldo_pendente: valorComissaoTotal,
          status: 'aberto'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar comissão:', insertError);
        throw insertError;
      }
      
      console.log('✅ Comissão criada com sucesso!', novaComissao);

      // Inserir detalhes dos agendamentos
      if (agendamentos && agendamentos.length > 0 && novaComissao) {
        const detalhes = agendamentos.map(apt => ({
          comissao_mensal_id: novaComissao.id,
          appointment_id: apt.id,
          valor_servico: apt.services?.preco || 0,
          taxa_custo: 0, // Por enquanto 0, pode ser implementado depois
          base_calculo: apt.services?.preco || 0,
          valor_comissao: (apt.services?.preco || 0) * (funcionario.percentual_comissao / 100)
        }));

        await supabase
          .from('comissoes_agendamentos_detalhes')
          .insert(detalhes);
      }
    }
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao recalcular comissões mensais:', error);
    throw error; // Re-lançar erro para ser capturado pelo componente
  }
};
