-- Script para adicionar campos necessários na tabela saloes
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar campos básicos do salão
ALTER TABLE public.saloes 
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}';

-- 2. Verificar se os campos foram adicionados
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'saloes'
AND column_name IN ('telefone', 'endereco', 'working_hours')
ORDER BY column_name;

-- 3. Verificar estrutura atual da tabela saloes
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'saloes'
ORDER BY ordinal_position;

-- 4. Inserir dados de exemplo (opcional)
-- UPDATE public.saloes 
-- SET 
--     telefone = '(11) 99999-9999',
--     endereco = 'Rua das Flores, 123 - Centro',
--     working_hours = '{
--         "monday": {"open": "08:00", "close": "18:00", "active": true},
--         "tuesday": {"open": "08:00", "close": "18:00", "active": true},
--         "wednesday": {"open": "08:00", "close": "18:00", "active": true},
--         "thursday": {"open": "08:00", "close": "18:00", "active": true},
--         "friday": {"open": "08:00", "close": "19:00", "active": true},
--         "saturday": {"open": "08:00", "close": "17:00", "active": true},
--         "sunday": {"open": "09:00", "close": "15:00", "active": false}
--     }'
-- WHERE id = 'seu-salao-id-aqui';
