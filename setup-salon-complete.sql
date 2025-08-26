-- Script completo para configurar campos do salão
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

-- 3. Inserir horários de funcionamento de exemplo
-- (Substitua 'seu-salao-id-aqui' pelo ID real do seu salão)
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
    telefone,
    endereco,
    working_hours
FROM public.saloes
WHERE id = 'seu-salao-id-aqui';

-- 5. Testar consultas de working_hours
SELECT 
    working_hours->>'monday' as segunda,
    (working_hours->'monday'->>'active')::boolean as ativo_segunda,
    working_hours->'monday'->>'open' as abertura_segunda,
    working_hours->'monday'->>'close' as fechamento_segunda
FROM public.saloes
WHERE id = 'seu-salao-id-aqui';

-- 6. Testar domingo (fechado)
SELECT 
    working_hours->>'sunday' as domingo,
    (working_hours->'sunday'->>'active')::boolean as ativo_domingo
FROM public.saloes
WHERE id = 'seu-salao-id-aqui';
