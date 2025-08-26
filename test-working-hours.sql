-- Script para testar horários de funcionamento na agenda
-- Execute este script no Supabase SQL Editor

-- IMPORTANTE: Execute primeiro o script add-salon-fields.sql se os campos não existem!

-- 1. Verificar se os campos existem
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'saloes'
AND column_name IN ('working_hours')
ORDER BY column_name;

-- Se não retornar nenhuma linha, execute primeiro:
-- add-salon-fields.sql

-- 2. Verificar dados atuais de working_hours
SELECT 
    id,
    nome,
    working_hours
FROM public.saloes
WHERE working_hours IS NOT NULL;

-- 3. Inserir horários de funcionamento de exemplo (substitua 'seu-salao-id' pelo ID real)
UPDATE public.saloes 
SET working_hours = '{
    "monday": {"open": "08:00", "close": "18:00", "active": true},
    "tuesday": {"open": "08:00", "close": "18:00", "active": true},
    "wednesday": {"open": "08:00", "close": "18:00", "active": true},
    "thursday": {"open": "08:00", "close": "18:00", "active": true},
    "friday": {"open": "08:00", "close": "19:00", "active": true},
    "saturday": {"open": "08:00", "close": "17:00", "active": true},
    "sunday": {"open": "09:00", "close": "15:00", "active": false}
}'
WHERE id = 'seu-salao-id-aqui';

-- 4. Verificar se foi atualizado
SELECT 
    id,
    nome,
    working_hours
FROM public.saloes
WHERE id = 'seu-salao-id-aqui';

-- 5. Testar diferentes cenários
-- Domingo (fechado)
SELECT 
    working_hours->>'sunday' as domingo,
    (working_hours->'sunday'->>'active')::boolean as ativo_domingo;

-- Segunda-feira (aberto)
SELECT 
    working_hours->>'monday' as segunda,
    (working_hours->'monday'->>'active')::boolean as ativo_segunda,
    working_hours->'monday'->>'open' as abertura_segunda,
    working_hours->'monday'->>'close' as fechamento_segunda;
