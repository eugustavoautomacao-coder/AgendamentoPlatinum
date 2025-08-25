import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    // Autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Permitir admin e superadmin
    const { data: profile, error: profileError } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile || (profile.role !== 'superadmin' && profile.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Obter dados do request
    const requestBody = await req.json();
    const { name, email, phone, observacoes, avatar_url, salon_id } = requestBody;
    console.log('Dados recebidos:', { name, email, phone, observacoes, avatar_url, salon_id });
    // Validação de UUID para salon_id
    function isUUID(str) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    }
    if (!name || !email || !salon_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!isUUID(salon_id)) {
      return new Response(JSON.stringify({ error: 'salon_id inválido (não é UUID)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Log detalhado do tipo e valor de salon_id
    console.log('LOG DEBUG: Tipo de salon_id:', typeof salon_id, 'Valor:', salon_id);
    // Service Role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    // Gerar senha aleatória
    const password = Math.random().toString(36).slice(-10) + 'Aa1!';
    // Criar usuário
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role: 'cliente',
        salon_id
      },
      email_confirm: true
    });
    console.log('Resultado createUser:', { authData, authError });
    if (authError) {
      console.log('Erro createUser:', authError);
      return new Response(JSON.stringify({ error: `Failed to create user: ${authError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!authData.user) {
      console.log('Erro: authData.user não retornado');
      return new Response(JSON.stringify({ error: 'User creation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Após criar o usuário, checar se o profile já existe
    const { data: profileCheck } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (profileCheck && profileCheck.id) {
      // Profile já existe, faça update
      const { error: updateError } = await supabaseAdmin.from('profiles').update({
        name,
        email, // garantir atualização do email
        role: 'cliente',
        salon_id,
        phone,
        observacoes: observacoes || '',
        avatar_url: avatar_url || ''
      }).eq('id', authData.user.id);
      if (updateError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return new Response(JSON.stringify({ error: `Failed to update profile: ${updateError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Profile não existe, faça insert
      const { error: insertError } = await supabaseAdmin.from('profiles').insert({
        id: authData.user.id,
        name,
        email, // garantir inserção do email
        role: 'cliente',
        salon_id,
        phone,
        observacoes: observacoes || '',
        avatar_url: avatar_url || ''
      });
      if (insertError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return new Response(JSON.stringify({ error: `Failed to insert profile: ${insertError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    return new Response(JSON.stringify({
      message: 'Cliente criado com sucesso',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: 'cliente',
        salon_id
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.log('Erro inesperado:', error);
    return new Response(JSON.stringify({ error: `Internal server error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 