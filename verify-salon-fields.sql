-- Script para verificar se os campos da tabela saloes existem
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela saloes existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'saloes' 
AND table_schema = 'public';

-- 2. Verificar estrutura completa da tabela saloes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'saloes'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar especificamente os campos que precisamos
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'saloes'
AND table_schema = 'public'
AND column_name IN ('telefone', 'endereco', 'working_hours')
ORDER BY column_name;

-- 4. Se os campos não existem, execute o script add-salon-fields.sql primeiro
-- O resultado deve mostrar 3 linhas se os campos existem
