-- =====================================================
-- SOLUÇÃO COM TRANSAÇÃO
-- =====================================================

BEGIN;

-- 1. Primeiro, atualiza o ID do usuário existente
UPDATE public.users 
SET id = 'a91c2391-d950-436d-85d2-bc435981ac9a',
    observacoes = 'ID sincronizado com auth.users'
WHERE email = 'luishisse@gmail.com';

-- 2. Agora atualiza os agendamentos para usar o novo ID
UPDATE appointments 
SET cliente_id = 'a91c2391-d950-436d-85d2-bc435981ac9a'
WHERE cliente_id = '4dfb0c06-2032-4fe5-be13-831b68d983c9';

-- 3. Confirma a transação
COMMIT;

-- 4. Verifica se funcionou
SELECT 'Usuário:' as info, id, email, nome, tipo 
FROM public.users 
WHERE email = 'luishisse@gmail.com';

SELECT 'Agendamentos:' as info, COUNT(*) as total
FROM appointments 
WHERE cliente_id = 'a91c2391-d950-436d-85d2-bc435981ac9a';
