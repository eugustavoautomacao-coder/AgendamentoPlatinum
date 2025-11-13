import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('=== Create Salon Admin Function Started ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar se o usuário é superadmin
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('No auth header found')
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
    console.log('User authenticated:', !!user)
    
    if (!user) {
      console.log('User not found')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é superadmin
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('tipo')
      .eq('id', user.id)
      .single()

    console.log('Profile query result:', { profile, profileError })

    if (profileError || !profile || profile.tipo !== 'system_admin') {
      console.log('User is not system_admin')
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter dados do request
    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    
    const { salonId, adminData } = requestBody
    
    if (!salonId || !adminData?.email || !adminData?.password || !adminData?.name) {
      console.log('Missing required fields:', { salonId, adminData })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se as variáveis de ambiente estão configuradas
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      serviceRoleKey: !!serviceRoleKey
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.log('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com privilégios de service_role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Creating user with admin client')

    // Criar usuário administrador
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      user_metadata: {
        name: adminData.name
      },
      email_confirm: true // Auto-confirmar email para evitar problemas
    })

    console.log('User creation result:', { 
      success: !!authData?.user, 
      userId: authData?.user?.id,
      error: authError?.message 
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      console.log('User creation failed - no user returned')
      return new Response(
        JSON.stringify({ error: 'User creation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating user record in users table')

    // Criar registro na tabela users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminData.email,
        nome: adminData.name,
        tipo: 'admin',
        salao_id: salonId,
        telefone: adminData.phone || null
      })

    console.log('User insert result:', { error: userError?.message })

    if (userError) {
      console.error('User insert error:', userError)
      
      // Se falhar ao inserir usuário, remover o usuário criado no Auth
      console.log('Rolling back user creation')
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return new Response(
        JSON.stringify({ error: `Failed to create user record: ${userError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('=== Success! Admin user created ===')

    return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: adminData.name
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})