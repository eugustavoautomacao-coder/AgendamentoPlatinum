-- Adicionar coluna codigo_interno na tabela produtos
-- Este script adiciona o campo código interno para identificação livre dos produtos

-- Adicionar a coluna codigo_interno (apenas números)
ALTER TABLE public.produtos 
ADD COLUMN codigo_interno VARCHAR(20) NOT NULL DEFAULT '';

-- Criar índice para melhor performance na busca
CREATE INDEX idx_produtos_codigo_interno ON public.produtos(codigo_interno);

-- Atualizar produtos existentes com códigos numéricos padrão (se houver)
-- Usando CTE para contornar a limitação de window functions no UPDATE
WITH produtos_com_sequencia AS (
    SELECT id, 
           LPAD(ROW_NUMBER() OVER (ORDER BY criado_em)::text, 3, '0') as novo_codigo
    FROM public.produtos 
    WHERE codigo_interno = ''
)
UPDATE public.produtos 
SET codigo_interno = pcs.novo_codigo
FROM produtos_com_sequencia pcs
WHERE public.produtos.id = pcs.id;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.produtos.codigo_interno IS 'Código interno numérico para identificação do produto (apenas números)';

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'produtos' 
AND column_name = 'codigo_interno';
