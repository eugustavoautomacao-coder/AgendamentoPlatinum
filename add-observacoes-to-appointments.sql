-- Script para adicionar campo observacoes na tabela appointments

-- 1. Adicionar campo observacoes na tabela appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 2. Verificar se o campo foi adicionado
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name = 'observacoes';

-- 3. Verificar estrutura atual da tabela appointments
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;
