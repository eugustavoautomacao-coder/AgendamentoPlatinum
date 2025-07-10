-- Insert SuperAdmin user directly
-- First, insert into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'alvex@gmail.com',
  crypt('projetoalvex2025', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "SuperAdmin"}',
  false,
  now()
);

-- Get the user ID and insert into profiles as superadmin
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id FROM auth.users WHERE email = 'alvex@gmail.com';
  
  -- Insert into profiles with superadmin role and no salon_id (superadmins don't belong to specific salons)
  INSERT INTO public.profiles (id, name, role, salon_id)
  VALUES (
    user_id,
    'SuperAdmin',
    'superadmin',
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    salon_id = NULL;
END $$;