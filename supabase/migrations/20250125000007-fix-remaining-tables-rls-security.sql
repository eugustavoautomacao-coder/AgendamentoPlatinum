-- ============================================
-- CORREÇÃO DE SEGURANÇA: RLS para tabelas restantes
-- ============================================
-- Este script habilita RLS e cria políticas para:
-- - comissoes
-- - comissoes_mensais
-- - comissoes_agendamentos_detalhes
-- - comissoes_historico
-- - pagamentos_comissoes
-- - blocked_slots
-- - categorias
-- - produtos
-- - appointment_requests
-- - appointment_photos

-- ============================================
-- 1. COMISSÕES
-- ============================================
ALTER TABLE IF EXISTS public.comissoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view commissions in their salon" ON public.comissoes;
DROP POLICY IF EXISTS "Admins can manage commissions in their salon" ON public.comissoes;

CREATE POLICY "Users can view commissions in their salon" 
ON public.comissoes
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = comissoes.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage commissions in their salon" 
ON public.comissoes
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = comissoes.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = comissoes.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 2. COMISSÕES MENSAIS
-- ============================================
ALTER TABLE IF EXISTS public.comissoes_mensais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view monthly commissions in their salon" ON public.comissoes_mensais;
DROP POLICY IF EXISTS "Admins can manage monthly commissions in their salon" ON public.comissoes_mensais;

CREATE POLICY "Users can view monthly commissions in their salon" 
ON public.comissoes_mensais
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = comissoes_mensais.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage monthly commissions in their salon" 
ON public.comissoes_mensais
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = comissoes_mensais.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = comissoes_mensais.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 3. COMISSÕES AGENDAMENTOS DETALHES
-- ============================================
ALTER TABLE IF EXISTS public.comissoes_agendamentos_detalhes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view commission details in their salon" ON public.comissoes_agendamentos_detalhes;
DROP POLICY IF EXISTS "Admins can manage commission details in their salon" ON public.comissoes_agendamentos_detalhes;

CREATE POLICY "Users can view commission details in their salon" 
ON public.comissoes_agendamentos_detalhes
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.comissoes_mensais cm
    JOIN public.users u ON u.salao_id = cm.salao_id
    WHERE u.id = auth.uid()
    AND cm.id = comissoes_agendamentos_detalhes.comissao_mensal_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage commission details in their salon" 
ON public.comissoes_agendamentos_detalhes
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.comissoes_mensais cm
    JOIN public.users u ON u.salao_id = cm.salao_id
    WHERE u.id = auth.uid()
    AND cm.id = comissoes_agendamentos_detalhes.comissao_mensal_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.comissoes_mensais cm
    JOIN public.users u ON u.salao_id = cm.salao_id
    WHERE u.id = auth.uid()
    AND cm.id = comissoes_agendamentos_detalhes.comissao_mensal_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 4. COMISSÕES HISTÓRICO
-- ============================================
ALTER TABLE IF EXISTS public.comissoes_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view commission history in their salon" ON public.comissoes_historico;
DROP POLICY IF EXISTS "Admins can manage commission history in their salon" ON public.comissoes_historico;

CREATE POLICY "Users can view commission history in their salon" 
ON public.comissoes_historico
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.comissoes c
    JOIN public.users u ON u.salao_id = c.salao_id
    WHERE u.id = auth.uid()
    AND c.id = comissoes_historico.comissao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage commission history in their salon" 
ON public.comissoes_historico
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.comissoes c
    JOIN public.users u ON u.salao_id = c.salao_id
    WHERE u.id = auth.uid()
    AND c.id = comissoes_historico.comissao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.comissoes c
    JOIN public.users u ON u.salao_id = c.salao_id
    WHERE u.id = auth.uid()
    AND c.id = comissoes_historico.comissao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 5. PAGAMENTOS COMISSÕES
-- ============================================
ALTER TABLE IF EXISTS public.pagamentos_comissoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view commission payments in their salon" ON public.pagamentos_comissoes;
DROP POLICY IF EXISTS "Admins can manage commission payments in their salon" ON public.pagamentos_comissoes;

CREATE POLICY "Users can view commission payments in their salon" 
ON public.pagamentos_comissoes
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.comissoes_mensais cm
    JOIN public.users u ON u.salao_id = cm.salao_id
    WHERE u.id = auth.uid()
    AND cm.id = pagamentos_comissoes.comissao_mensal_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage commission payments in their salon" 
ON public.pagamentos_comissoes
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.comissoes_mensais cm
    JOIN public.users u ON u.salao_id = cm.salao_id
    WHERE u.id = auth.uid()
    AND cm.id = pagamentos_comissoes.comissao_mensal_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.comissoes_mensais cm
    JOIN public.users u ON u.salao_id = cm.salao_id
    WHERE u.id = auth.uid()
    AND cm.id = pagamentos_comissoes.comissao_mensal_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 6. BLOCKED SLOTS
-- ============================================
ALTER TABLE IF EXISTS public.blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view blocked slots in their salon" ON public.blocked_slots;
DROP POLICY IF EXISTS "Admins can manage blocked slots in their salon" ON public.blocked_slots;

CREATE POLICY "Users can view blocked slots in their salon" 
ON public.blocked_slots
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = blocked_slots.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage blocked slots in their salon" 
ON public.blocked_slots
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = blocked_slots.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = blocked_slots.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 7. CATEGORIAS
-- ============================================
ALTER TABLE IF EXISTS public.categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view categories in their salon" ON public.categorias;
DROP POLICY IF EXISTS "Admins can manage categories in their salon" ON public.categorias;

CREATE POLICY "Users can view categories in their salon" 
ON public.categorias
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = categorias.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage categories in their salon" 
ON public.categorias
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = categorias.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = categorias.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 8. PRODUTOS
-- ============================================
ALTER TABLE IF EXISTS public.produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view products in their salon" ON public.produtos;
DROP POLICY IF EXISTS "Admins can manage products in their salon" ON public.produtos;

CREATE POLICY "Users can view products in their salon" 
ON public.produtos
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = produtos.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage products in their salon" 
ON public.produtos
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = produtos.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = produtos.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 9. APPOINTMENT REQUESTS
-- ============================================
ALTER TABLE IF EXISTS public.appointment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create appointment requests" ON public.appointment_requests;
DROP POLICY IF EXISTS "Users can view appointment requests in their salon" ON public.appointment_requests;
DROP POLICY IF EXISTS "Admins can manage appointment requests in their salon" ON public.appointment_requests;

CREATE POLICY "Public can create appointment requests" 
ON public.appointment_requests
FOR INSERT 
TO public
WITH CHECK (
  -- Validar que o salao_id existe
  EXISTS (
    SELECT 1 FROM public.saloes 
    WHERE id = appointment_requests.salao_id
  )
  AND
  -- Validar que o serviço existe e pertence ao salão
  (
    appointment_requests.servico_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = appointment_requests.servico_id
      AND s.salao_id = appointment_requests.salao_id
      AND s.ativo = true
    )
  )
  AND
  -- Validar que o funcionário existe e pertence ao salão (se fornecido)
  (
    appointment_requests.funcionario_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = appointment_requests.funcionario_id
      AND e.salao_id = appointment_requests.salao_id
      AND e.ativo = true
    )
  )
);

CREATE POLICY "Users can view appointment requests in their salon" 
ON public.appointment_requests
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointment_requests.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage appointment requests in their salon" 
ON public.appointment_requests
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointment_requests.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointment_requests.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- 10. APPOINTMENT PHOTOS
-- ============================================
ALTER TABLE IF EXISTS public.appointment_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view appointment photos in their salon" ON public.appointment_photos;
DROP POLICY IF EXISTS "Admins can manage appointment photos in their salon" ON public.appointment_photos;

CREATE POLICY "Users can view appointment photos in their salon" 
ON public.appointment_photos
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.users u ON u.salao_id = a.salao_id
    WHERE u.id = auth.uid()
    AND a.id = appointment_photos.appointment_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

CREATE POLICY "Admins can manage appointment photos in their salon" 
ON public.appointment_photos
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.users u ON u.salao_id = a.salao_id
    WHERE u.id = auth.uid()
    AND a.id = appointment_photos.appointment_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.users u ON u.salao_id = a.salao_id
    WHERE u.id = auth.uid()
    AND a.id = appointment_photos.appointment_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

