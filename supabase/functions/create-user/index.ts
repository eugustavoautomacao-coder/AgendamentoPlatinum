import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Autenticação do usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é superadmin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profileError || !profile || profile.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter dados do request
    const requestBody = await req.json()
    const { name, email, password, role, salon_id } = requestBody
    if (!name || !email || !password || !role || (role !== 'cliente' && !salon_id)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (role === 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Cadastro de superadmin não permitido' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Service Role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Criar usuário
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        role,
        salon_id: role === 'cliente' ? null : salon_id
      },
      email_confirm: true
    })
    console.log('Auth createUser result:', { authData, authError });
    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar perfil
    const { error: profileError2 } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        role,
        salon_id: role === 'cliente' ? null : salon_id
      })
      .eq('id', authData.user.id)
    console.log('Profile update result:', { error: profileError2 });
    if (profileError2) {
      // rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.log('Rollback after profile update error');
      return new Response(
        JSON.stringify({ error: `Failed to update profile: ${profileError2.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Se for profissional, aguardar até o registro em profiles existir antes de inserir em professionals
    if (role === 'profissional') {
      let profileExists = false;
      for (let i = 0; i < 10; i++) {
        const { data: profileCheck, error: profileCheckError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single();
        console.log(`Tentativa ${i+1} de encontrar profile:`, { profileCheck, profileCheckError });
        if (profileCheck && profileCheck.id) {
          profileExists = true;
          break;
        }
        await new Promise(res => setTimeout(res, 500));
      }
      if (!profileExists) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Rollback after profile not found');
        return new Response(
          JSON.stringify({ error: 'Profile record not found after user creation. Tente novamente.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const { error: professionalError } = await supabaseAdmin
        .from('professionals')
        .insert([{
          id: authData.user.id,
          salon_id: salon_id,
          specialties: [],
          schedule: {},
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      console.log('Professional insert result:', { error: professionalError });
      if (professionalError) {
        // rollback
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Rollback after professional insert error');
        return new Response(
          JSON.stringify({ error: `Failed to insert professional: ${professionalError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Usuário criado com sucesso',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name,
          role,
          salon_id: role === 'cliente' ? null : salon_id
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 