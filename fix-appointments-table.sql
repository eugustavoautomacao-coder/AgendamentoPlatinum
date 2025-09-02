-- Script para corrigir a tabela appointments
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela appointments
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

-- 2. Adicionar coluna appointment_request_id se não existir
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_request_id UUID REFERENCES appointment_requests(id);

-- 3. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'appointment_request_id';

-- 4. Verificar se há relacionamentos existentes
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='appointments';

-- 5. Se necessário, criar índice para performance
CREATE INDEX IF NOT EXISTS idx_appointments_request_id ON appointments(appointment_request_id);
