-- Adicionar campo para controlar quando a comissão foi ativada
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS data_inicio_comissao timestamp with time zone;

-- Comentário explicativo
COMMENT ON COLUMN public.employees.data_inicio_comissao IS 
'Data em que a comissão foi ativada para este funcionário. Usado para calcular comissões apenas de agendamentos a partir desta data.';

-- Para funcionários que já têm comissão > 0, setar a data como agora
-- (assumindo que começaram a usar comissão agora)
UPDATE public.employees 
SET data_inicio_comissao = NOW()
WHERE percentual_comissao > 0 
  AND data_inicio_comissao IS NULL;

-- Função para atualizar data_inicio_comissao automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_data_inicio_comissao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a comissão mudou de 0 (ou NULL) para > 0, registrar a data
  IF (OLD.percentual_comissao IS NULL OR OLD.percentual_comissao = 0) 
     AND NEW.percentual_comissao > 0 
     AND NEW.data_inicio_comissao IS NULL THEN
    NEW.data_inicio_comissao := NOW();
    RAISE NOTICE 'Comissão ativada para funcionário %. Data início: %', NEW.nome, NEW.data_inicio_comissao;
  END IF;
  
  -- Se a comissão foi zerada, limpar a data
  IF (OLD.percentual_comissao > 0) 
     AND (NEW.percentual_comissao IS NULL OR NEW.percentual_comissao = 0) THEN
    NEW.data_inicio_comissao := NULL;
    RAISE NOTICE 'Comissão desativada para funcionário %', NEW.nome;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_atualizar_data_inicio_comissao ON public.employees;
CREATE TRIGGER trigger_atualizar_data_inicio_comissao
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_data_inicio_comissao();

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_employees_data_inicio_comissao 
ON public.employees(data_inicio_comissao) 
WHERE data_inicio_comissao IS NOT NULL;


