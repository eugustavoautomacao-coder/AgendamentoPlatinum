-- Script para deletar serviços específicos por ID
-- Use este script se quiser deletar serviços específicos ao invés de todos os padrão

-- ============================================
-- PASSO 1: Identificar o ID do serviço a ser deletado
-- ============================================
-- Execute este SELECT para ver os serviços e seus IDs
SELECT 
    s.id,
    s.nome,
    s.salao_id,
    s.criado_em,
    COUNT(a.id) as total_appointments
FROM public.services s
LEFT JOIN public.appointments a ON a.servico_id = s.id
GROUP BY s.id, s.nome, s.salao_id, s.criado_em
ORDER BY s.criado_em DESC;

-- ============================================
-- PASSO 2: Substituir o ID abaixo pelo ID do serviço que deseja deletar
-- ============================================
-- Exemplo: '387da486-ba93-42c3-8adc-09de8778e474'

DO $$
DECLARE
    service_id_to_delete UUID := '387da486-ba93-42c3-8adc-09de8778e474'; -- SUBSTITUA AQUI
    appointments_count INTEGER;
BEGIN
    -- Verificar quantos appointments serão afetados
    SELECT COUNT(*) INTO appointments_count
    FROM public.appointments
    WHERE servico_id = service_id_to_delete;
    
    RAISE NOTICE 'Serviço a ser deletado: %', service_id_to_delete;
    RAISE NOTICE 'Appointments que serão deletados: %', appointments_count;
    
    -- Deletar appointments relacionados
    DELETE FROM public.appointments
    WHERE servico_id = service_id_to_delete;
    
    -- Deletar appointment_requests relacionados
    DELETE FROM public.appointment_requests
    WHERE servico_id = service_id_to_delete;
    
    -- Deletar comissões relacionadas
    DELETE FROM public.comissoes
    WHERE servico_id = service_id_to_delete;
    
    -- Deletar o serviço
    DELETE FROM public.services
    WHERE id = service_id_to_delete;
    
    RAISE NOTICE 'Serviço e dependências deletados com sucesso!';
END $$;

-- ============================================
-- VERSÃO ALTERNATIVA: Deletar múltiplos serviços por lista de IDs
-- ============================================
-- Use esta versão se quiser deletar vários serviços de uma vez

DO $$
DECLARE
    service_ids UUID[] := ARRAY[
        '387da486-ba93-42c3-8adc-09de8778e474'::UUID,
        -- Adicione mais IDs aqui separados por vírgula
        -- 'outro-id-aqui'::UUID
    ];
    appointments_count INTEGER;
BEGIN
    -- Verificar quantos appointments serão afetados
    SELECT COUNT(*) INTO appointments_count
    FROM public.appointments
    WHERE servico_id = ANY(service_ids);
    
    RAISE NOTICE 'Serviços a serem deletados: %', array_length(service_ids, 1);
    RAISE NOTICE 'Appointments que serão deletados: %', appointments_count;
    
    -- Deletar appointments relacionados
    DELETE FROM public.appointments
    WHERE servico_id = ANY(service_ids);
    
    -- Deletar appointment_requests relacionados
    DELETE FROM public.appointment_requests
    WHERE servico_id = ANY(service_ids);
    
    -- Deletar comissões relacionadas
    DELETE FROM public.comissoes
    WHERE servico_id = ANY(service_ids);
    
    -- Deletar os serviços
    DELETE FROM public.services
    WHERE id = ANY(service_ids);
    
    RAISE NOTICE 'Serviços e dependências deletados com sucesso!';
END $$;

