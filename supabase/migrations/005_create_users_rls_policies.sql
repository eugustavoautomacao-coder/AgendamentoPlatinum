-- Políticas RLS para a tabela 'users' - Permitir que admins atualizem profissionais
-- Execute este script no SQL Editor do Supabase Dashboard

-- Habilitar RLS na tabela users se não estiver habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view users in their salon" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update users in their salon" ON public.users;
DROP POLICY IF EXISTS "Users can view their own user" ON public.users;

-- Política para permitir que usuários vejam a si mesmos e usuários do mesmo salão
CREATE POLICY "Users can view users in their salon" 
ON public.users
FOR SELECT 
TO authenticated
USING (
  -- Usuários podem ver a si mesmos
  id = auth.uid() OR
  -- Ou usuários do mesmo salão
  (
    (SELECT salao_id FROM public.users WHERE id = auth.uid()) IS NOT NULL AND
    salao_id = (SELECT salao_id FROM public.users WHERE id = auth.uid())
  ) OR
  -- Ou através da tabela employees
  (
    EXISTS (
      SELECT 1 FROM public.employees e1
      WHERE e1.user_id = auth.uid()
    ) AND
    id IN (
      SELECT e2.user_id 
      FROM public.employees e1
      JOIN public.employees e2 ON e1.salao_id = e2.salao_id
      WHERE e1.user_id = auth.uid()
    )
  )
);

-- Política para permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update their own profile" 
ON public.users
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política para permitir que admins atualizem usuários do mesmo salão
-- Especialmente útil para atualizar avatar_url de profissionais
CREATE POLICY "Admins can update users in their salon" 
ON public.users
FOR UPDATE 
TO authenticated
USING (
  -- Verificar se o usuário atual é admin
  (SELECT tipo FROM public.users WHERE id = auth.uid()) = 'admin' AND
  -- Verificar se o usuário a ser atualizado pertence ao mesmo salão
  (
    -- Mesmo salão através do campo salao_id
    (
      (SELECT salao_id FROM public.users WHERE id = auth.uid()) IS NOT NULL AND
      salao_id = (SELECT salao_id FROM public.users WHERE id = auth.uid())
    ) OR
    -- Ou através da tabela employees
    (
      EXISTS (
        SELECT 1 FROM public.employees e1
        WHERE e1.user_id = auth.uid()
      ) AND
      id IN (
        SELECT e2.user_id 
        FROM public.employees e1
        JOIN public.employees e2 ON e1.salao_id = e2.salao_id
        WHERE e1.user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  -- Mesma verificação para WITH CHECK
  (SELECT tipo FROM public.users WHERE id = auth.uid()) = 'admin' AND
  (
    (
      (SELECT salao_id FROM public.users WHERE id = auth.uid()) IS NOT NULL AND
      salao_id = (SELECT salao_id FROM public.users WHERE id = auth.uid())
    ) OR
    (
      EXISTS (
        SELECT 1 FROM public.employees e1
        WHERE e1.user_id = auth.uid()
      ) AND
      id IN (
        SELECT e2.user_id 
        FROM public.employees e1
        JOIN public.employees e2 ON e1.salao_id = e2.salao_id
        WHERE e1.user_id = auth.uid()
      )
    )
  )
);

