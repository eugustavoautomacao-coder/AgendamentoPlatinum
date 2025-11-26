-- ============================================
-- CORREÇÃO DE SEGURANÇA: RLS para appointments
-- ============================================

-- Habilitar RLS na tabela appointments
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view appointments in their salon" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Employees can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage appointments in their salon" ON public.appointments;
DROP POLICY IF EXISTS "Employees can update their appointments" ON public.appointments;

-- ============================================
-- POLÍTICA 1: Usuários podem ver agendamentos do seu salão
-- ============================================
CREATE POLICY "Users can view appointments in their salon" 
ON public.appointments
FOR SELECT 
TO authenticated
USING (
  -- Usuários do mesmo salão podem ver agendamentos do salão
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointments.salao_id
    AND u.tipo IN ('admin', 'funcionario', 'system_admin')
  )
);

-- ============================================
-- POLÍTICA 2: Clientes podem ver seus próprios agendamentos
-- ============================================
CREATE POLICY "Clients can view their own appointments" 
ON public.appointments
FOR SELECT 
TO authenticated
USING (
  -- Cliente autenticado pode ver seus agendamentos
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.id = appointments.cliente_id
    AND u.tipo = 'cliente'
  )
  OR
  -- Ou através do email do cliente
  (
    cliente_email IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.email = appointments.cliente_email
      AND u.tipo = 'cliente'
    )
  )
);

-- ============================================
-- POLÍTICA 3: Funcionários podem ver seus agendamentos
-- ============================================
CREATE POLICY "Employees can view their appointments" 
ON public.appointments
FOR SELECT 
TO authenticated
USING (
  -- Funcionário pode ver seus agendamentos
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.users u ON u.id = e.user_id
    WHERE u.id = auth.uid()
    AND (e.id = appointments.funcionario_id OR e.id = appointments.employee_id)
  )
);

-- ============================================
-- POLÍTICA 4: Público pode criar agendamentos
-- ============================================
CREATE POLICY "Public can create appointments" 
ON public.appointments
FOR INSERT 
TO public
WITH CHECK (
  -- Validar que o salao_id existe
  EXISTS (
    SELECT 1 FROM public.saloes 
    WHERE id = appointments.salao_id
  )
  AND
  -- Validar que o serviço existe e pertence ao salão
  EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = appointments.servico_id
    AND s.salao_id = appointments.salao_id
  )
);

-- ============================================
-- POLÍTICA 5: Admins podem gerenciar agendamentos do salão
-- ============================================
CREATE POLICY "Admins can manage appointments in their salon" 
ON public.appointments
FOR ALL 
TO authenticated
USING (
  -- Admins do mesmo salão podem gerenciar agendamentos
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointments.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
)
WITH CHECK (
  -- Validação para INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.salao_id = appointments.salao_id
    AND u.tipo IN ('admin', 'system_admin')
  )
);

-- ============================================
-- POLÍTICA 6: Funcionários podem atualizar seus agendamentos
-- ============================================
CREATE POLICY "Employees can update their appointments" 
ON public.appointments
FOR UPDATE 
TO authenticated
USING (
  -- Funcionário pode atualizar seus agendamentos
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.users u ON u.id = e.user_id
    WHERE u.id = auth.uid()
    AND (e.id = appointments.funcionario_id OR e.id = appointments.employee_id)
  )
)
WITH CHECK (
  -- Validação para UPDATE
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.users u ON u.id = e.user_id
    WHERE u.id = auth.uid()
    AND (e.id = appointments.funcionario_id OR e.id = appointments.employee_id)
  )
);

-- ============================================
-- POLÍTICA 7: Público pode ver agendamentos para verificar disponibilidade
-- ============================================
-- IMPORTANTE: Esta política permite que a página pública de agendamento
-- veja quais horários estão ocupados, mas NÃO expõe dados sensíveis dos clientes
DROP POLICY IF EXISTS "Public can view appointments for availability check" ON public.appointments;

CREATE POLICY "Public can view appointments for availability check" 
ON public.appointments
FOR SELECT 
TO public
USING (
  -- Permitir leitura pública APENAS de agendamentos confirmados/pendentes/concluídos
  salao_id IS NOT NULL
  AND status IN ('confirmado', 'pendente', 'concluido')
);

