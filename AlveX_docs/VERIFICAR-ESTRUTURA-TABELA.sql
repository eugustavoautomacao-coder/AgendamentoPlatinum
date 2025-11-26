-- Verificar estrutura da tabela appointment_requests
-- Para confirmar que os campos existem e estão corretos

-- 1. Ver colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appointment_requests'
ORDER BY ordinal_position;

-- 2. Ver foreign keys (para validar se as referências estão corretas)
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'appointment_requests';

-- 3. Testar se os IDs fornecidos existem

-- Salao existe?
SELECT id, nome FROM public.saloes 
WHERE id = 'f86c606d-7107-4a3e-b917-61d924b00ae9';

-- Serviço existe e está ativo?
SELECT id, nome, salao_id, ativo 
FROM public.services 
WHERE id = '489543cd-f793-4a73-9948-e6efb38befe5';

-- Funcionário existe e está ativo?
SELECT id, nome, salao_id, ativo 
FROM public.employees 
WHERE id = '5fb99bbf-bc40-48be-be03-3831fa22635c';


