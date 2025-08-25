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

    // Verificar se é system_admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('tipo')
      .eq('id', user.id)
      .single()
    if (profileError || !profile || profile.tipo !== 'system_admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter dados do request
    const requestBody = await req.json()
    const { nome, email, password, tipo, salao_id } = requestBody
    if (!nome || !email || !password || !tipo || (tipo !== 'cliente' && !salao_id)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (tipo === 'system_admin') {
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
        nome,
        tipo,
        salao_id: tipo === 'cliente' ? null : salao_id
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

    // Criar registro na tabela users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        nome,
        tipo,
        salao_id: tipo === 'cliente' ? null : salao_id,
        email
      })

    console.log('User insert result:', { error: userError });
    if (userError) {
      // rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.log('Rollback after user insert error');
      return new Response(
        JSON.stringify({ error: `Failed to create user record: ${userError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Se for funcionário, criar registro na tabela employees
    if (tipo === 'funcionario') {
      const { error: employeeError } = await supabaseAdmin
        .from('employees')
        .insert([{
          user_id: authData.user.id,
          salao_id: salao_id,
          nome,
          email,
          cargo: 'Funcionário'
        }]);
      console.log('Employee insert result:', { error: employeeError });
      if (employeeError) {
        // rollback
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Rollback after employee insert error');
        return new Response(
          JSON.stringify({ error: `Failed to insert employee: ${employeeError.message}` }),
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
          nome,
          tipo,
          salao_id: tipo === 'cliente' ? null : salao_id
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