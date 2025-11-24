-- Script para deletar todos os serviços padrão do sistema
-- Este script remove primeiro os appointments relacionados e depois os serviços

-- ============================================
-- PASSO 1: Verificar quais serviços serão deletados
-- ============================================
-- Execute este SELECT primeiro para ver quais serviços serão afetados
SELECT 
    s.id,
    s.nome,
    s.salao_id,
    s.criado_em,
    COUNT(a.id) as total_appointments
FROM public.services s
LEFT JOIN public.appointments a ON a.servico_id = s.id
WHERE s.salao_id IS NULL  -- Serviços sem salão (padrão do sistema)
   OR s.salao_id = '00000000-0000-0000-0000-000000000000'  -- Serviços do salão padrão
GROUP BY s.id, s.nome, s.salao_id, s.criado_em
ORDER BY total_appointments DESC;

-- ============================================
-- PASSO 2: Verificar appointments que serão deletados
-- ============================================
SELECT 
    a.id,
    a.data_hora,
    a.status,
    a.cliente_nome,
    s.nome as servico_nome
FROM public.appointments a
INNER JOIN public.services s ON s.id = a.servico_id
WHERE s.salao_id IS NULL 
   OR s.salao_id = '00000000-0000-0000-0000-000000000000';

-- ============================================
-- PASSO 3: Deletar appointments relacionados aos serviços padrão
-- ============================================
-- ATENÇÃO: Isso vai deletar todos os appointments que referenciam serviços padrão
DELETE FROM public.appointments
WHERE servico_id IN (
    SELECT id 
    FROM public.services 
    WHERE salao_id IS NULL 
       OR salao_id = '00000000-0000-0000-0000-000000000000'
);

-- ============================================
-- PASSO 4: Deletar appointment_requests relacionados
-- ============================================
DELETE FROM public.appointment_requests
WHERE servico_id IN (
    SELECT id 
    FROM public.services 
    WHERE salao_id IS NULL 
       OR salao_id = '00000000-0000-0000-0000-000000000000'
);

-- ============================================
-- PASSO 5: Deletar comissões relacionadas
-- ============================================
DELETE FROM public.comissoes
WHERE servico_id IN (
    SELECT id 
    FROM public.services 
    WHERE salao_id IS NULL 
       OR salao_id = '00000000-0000-0000-0000-000000000000'
);

-- ============================================
-- PASSO 6: Deletar os serviços padrão
-- ============================================
DELETE FROM public.services
WHERE salao_id IS NULL 
   OR salao_id = '00000000-0000-0000-0000-000000000000';

-- ============================================
-- PASSO 7: Configurar ON DELETE CASCADE na foreign key (OPCIONAL)
-- ============================================
-- Isso permite que futuras deleções de serviços deletem automaticamente os appointments relacionados
-- ATENÇÃO: Isso é uma mudança permanente na estrutura do banco

-- Primeiro, remover a constraint antiga
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_servico_id_fkey;

-- Recriar com ON DELETE CASCADE
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_servico_id_fkey 
FOREIGN KEY (servico_id) 
REFERENCES public.services(id) 
ON DELETE CASCADE;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Verificar se ainda existem serviços padrão
SELECT COUNT(*) as servicos_padrao_restantes
FROM public.services
WHERE salao_id IS NULL 
   OR salao_id = '00000000-0000-0000-0000-000000000000';

-- Verificar se ainda existem appointments órfãos
SELECT COUNT(*) as appointments_orfos
FROM public.appointments
WHERE servico_id NOT IN (SELECT id FROM public.services);

-- ============================================
-- RESUMO DA OPERAÇÃO
-- ============================================
-- Execute este SELECT para ver o resumo do que foi deletado
SELECT 
    'Serviços deletados' as operacao,
    COUNT(*) as total
FROM public.services
WHERE salao_id IS NULL 
   OR salao_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 
    'Appointments deletados' as operacao,
    COUNT(*) as total
FROM public.appointments
WHERE servico_id NOT IN (SELECT id FROM public.services);

