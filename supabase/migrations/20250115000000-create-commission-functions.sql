-- Função para registrar pagamento de comissão
CREATE OR REPLACE FUNCTION public.registrar_pagamento_comissao(
  p_comissao_mensal_id uuid,
  p_valor_pago numeric,
  p_forma_pagamento character varying DEFAULT 'PIX',
  p_observacoes text DEFAULT NULL,
  p_usuario_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a comissão mensal existe
  IF NOT EXISTS (SELECT 1 FROM public.comissoes_mensais WHERE id = p_comissao_mensal_id) THEN
    RAISE EXCEPTION 'Comissão mensal não encontrada';
  END IF;

  -- Verificar se o valor não excede o saldo pendente
  IF p_valor_pago > (SELECT saldo_pendente FROM public.comissoes_mensais WHERE id = p_comissao_mensal_id) THEN
    RAISE EXCEPTION 'Valor do pagamento excede o saldo pendente';
  END IF;

  -- Inserir o pagamento
  INSERT INTO public.pagamentos_comissoes (
    comissao_mensal_id,
    valor_pago,
    forma_pagamento,
    observacoes,
    usuario_id
  ) VALUES (
    p_comissao_mensal_id,
    p_valor_pago,
    p_forma_pagamento,
    p_observacoes,
    p_usuario_id
  );

  -- Atualizar a comissão mensal
  UPDATE public.comissoes_mensais 
  SET 
    valor_pago = valor_pago + p_valor_pago,
    saldo_pendente = saldo_pendente - p_valor_pago,
    status = CASE 
      WHEN (saldo_pendente - p_valor_pago) <= 0 THEN 'pago'
      ELSE 'aberto'
    END,
    atualizado_em = now()
  WHERE id = p_comissao_mensal_id;

END;
$$;

-- Função para marcar comissão individual como paga
CREATE OR REPLACE FUNCTION public.marcar_comissao_paga(
  p_comissao_id uuid,
  p_observacoes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a comissão existe
  IF NOT EXISTS (SELECT 1 FROM public.comissoes WHERE id = p_comissao_id) THEN
    RAISE EXCEPTION 'Comissão não encontrada';
  END IF;

  -- Atualizar a comissão
  UPDATE public.comissoes 
  SET 
    status = 'paga',
    data_pagamento = now(),
    observacoes = COALESCE(p_observacoes, observacoes),
    atualizado_em = now()
  WHERE id = p_comissao_id;

END;
$$;

-- Função para recalcular comissões mensais quando há novos agendamentos
CREATE OR REPLACE FUNCTION public.recalcular_comissoes_mensais(
  p_funcionario_id uuid,
  p_mes integer,
  p_ano integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_salao_id uuid;
  v_percentual_comissao numeric;
  v_total_agendamentos integer;
  v_total_servicos numeric;
  v_valor_comissao_total numeric;
  v_valor_pago numeric;
  v_saldo_pendente numeric;
  v_comissao_mensal_id uuid;
BEGIN
  -- Obter salao_id do funcionário
  SELECT salao_id INTO v_salao_id FROM public.employees WHERE id = p_funcionario_id;
  
  -- Obter percentual de comissão do funcionário
  SELECT percentual_comissao INTO v_percentual_comissao FROM public.employees WHERE id = p_funcionario_id;
  
  -- Calcular totais dos agendamentos do mês
  SELECT 
    COUNT(*),
    COALESCE(SUM(apt.servico_preco), 0)
  INTO 
    v_total_agendamentos,
    v_total_servicos
  FROM public.appointments apt
  WHERE 
    apt.funcionario_id = p_funcionario_id
    AND EXTRACT(MONTH FROM apt.data_hora) = p_mes
    AND EXTRACT(YEAR FROM apt.data_hora) = p_ano
    AND apt.status IN ('confirmado', 'concluido');

  -- Calcular valor total da comissão
  v_valor_comissao_total := v_total_servicos * (v_percentual_comissao / 100);

  -- Verificar se já existe comissão mensal para este funcionário/mês/ano
  SELECT id, valor_pago INTO v_comissao_mensal_id, v_valor_pago
  FROM public.comissoes_mensais 
  WHERE 
    funcionario_id = p_funcionario_id 
    AND mes = p_mes 
    AND ano = p_ano;

  IF v_comissao_mensal_id IS NOT NULL THEN
    -- Atualizar comissão existente
    v_saldo_pendente := v_valor_comissao_total - v_valor_pago;
    
    UPDATE public.comissoes_mensais 
    SET 
      total_agendamentos = v_total_agendamentos,
      total_servicos = v_total_servicos,
      valor_comissao_total = v_valor_comissao_total,
      saldo_pendente = v_saldo_pendente,
      status = CASE 
        WHEN v_saldo_pendente <= 0 THEN 'pago'
        ELSE 'aberto'
      END,
      atualizado_em = now()
    WHERE id = v_comissao_mensal_id;
  ELSE
    -- Criar nova comissão mensal
    v_saldo_pendente := v_valor_comissao_total;
    
    INSERT INTO public.comissoes_mensais (
      salao_id,
      funcionario_id,
      mes,
      ano,
      total_agendamentos,
      total_servicos,
      percentual_comissao,
      valor_comissao_total,
      saldo_pendente,
      status
    ) VALUES (
      v_salao_id,
      p_funcionario_id,
      p_mes,
      p_ano,
      v_total_agendamentos,
      v_total_servicos,
      v_percentual_comissao,
      v_valor_comissao_total,
      v_saldo_pendente,
      'aberto'
    );
  END IF;

END;
$$;

-- Trigger para recalcular comissões quando um agendamento é atualizado
CREATE OR REPLACE FUNCTION public.trigger_recalcular_comissoes()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular comissões para o funcionário do agendamento
  IF NEW.funcionario_id IS NOT NULL AND NEW.status IN ('confirmado', 'concluido') THEN
    PERFORM public.recalcular_comissoes_mensais(
      NEW.funcionario_id,
      EXTRACT(MONTH FROM NEW.data_hora)::integer,
      EXTRACT(YEAR FROM NEW.data_hora)::integer
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_recalcular_comissoes_on_appointments ON public.appointments;
CREATE TRIGGER trigger_recalcular_comissoes_on_appointments
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalcular_comissoes();
