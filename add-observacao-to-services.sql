-- Script para adicionar campo observacao na tabela services
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar campo observacao na tabela services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- 2. Verificar se o campo foi adicionado
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'services'
AND column_name = 'observacao'
ORDER BY column_name;

-- 3. Verificar estrutura atual da tabela services
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- 4. Inserir dados de exemplo (opcional)
-- UPDATE public.services 
-- SET observacao = 'Observação de exemplo para este serviço'
-- WHERE id = 'seu-servico-id-aqui';

-- 5. Verificar se foi atualizado
SELECT 
    id,
    nome,
    observacao
FROM public.services
LIMIT 5;
