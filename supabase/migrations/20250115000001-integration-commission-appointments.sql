-- Trigger para recalcular comissões quando um agendamento é atualizado
CREATE OR REPLACE FUNCTION public.trigger_recalcular_comissoes_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular comissões para o funcionário do agendamento quando status muda para 'concluido'
  IF NEW.funcionario_id IS NOT NULL 
     AND NEW.status = 'concluido' 
     AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    
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
  EXECUTE FUNCTION public.trigger_recalcular_comissoes_appointment();

-- Função para recalcular todas as comissões de um funcionário
CREATE OR REPLACE FUNCTION public.recalcular_todas_comissoes_funcionario(
  p_funcionario_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agendamento RECORD;
BEGIN
  -- Buscar todos os agendamentos concluídos do funcionário
  FOR v_agendamento IN 
    SELECT DISTINCT 
      EXTRACT(MONTH FROM data_hora)::integer as mes,
      EXTRACT(YEAR FROM data_hora)::integer as ano
    FROM public.appointments 
    WHERE funcionario_id = p_funcionario_id 
      AND status = 'concluido'
    ORDER BY ano DESC, mes DESC
  LOOP
    -- Recalcular comissões para cada mês/ano
    PERFORM public.recalcular_comissoes_mensais(
      p_funcionario_id,
      v_agendamento.mes,
      v_agendamento.ano
    );
  END LOOP;
END;
$$;

-- Função para recalcular todas as comissões do salão
CREATE OR REPLACE FUNCTION public.recalcular_todas_comissoes_salao(
  p_salao_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_funcionario RECORD;
BEGIN
  -- Buscar todos os funcionários ativos do salão
  FOR v_funcionario IN 
    SELECT id FROM public.employees 
    WHERE salao_id = p_salao_id AND ativo = true
  LOOP
    -- Recalcular comissões para cada funcionário
    PERFORM public.recalcular_todas_comissoes_funcionario(v_funcionario.id);
  END LOOP;
END;
$$;

-- Função para obter estatísticas de comissões do salão
CREATE OR REPLACE FUNCTION public.estatisticas_comissoes_salao(
  p_salao_id uuid,
  p_mes integer DEFAULT NULL,
  p_ano integer DEFAULT NULL
)
RETURNS TABLE(
  total_comissoes numeric,
  total_pago numeric,
  saldo_pendente numeric,
  total_funcionarios integer,
  comissoes_abertas integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(c.valor_comissao_total), 0) as total_comissoes,
    COALESCE(SUM(c.valor_pago), 0) as total_pago,
    COALESCE(SUM(c.saldo_pendente), 0) as saldo_pendente,
    COUNT(DISTINCT c.funcionario_id) as total_funcionarios,
    COUNT(CASE WHEN c.status = 'aberto' THEN 1 END) as comissoes_abertas
  FROM public.comissoes_mensais c
  WHERE c.salao_id = p_salao_id
    AND (p_mes IS NULL OR c.mes = p_mes)
    AND (p_ano IS NULL OR c.ano = p_ano);
END;
$$;


