import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('🚀 Edge Function create-professional iniciada');
    // Obter dados do request
    const requestBody = await req.json();
    const { name, email, password, phone, cargo, percentual_comissao, salon_id } = requestBody;
    console.log('📝 Dados recebidos:', {
      name,
      email,
      phone,
      cargo,
      percentual_comissao,
      salon_id
    });
    // Validação básica
    if (!name || !email || !password || !salon_id) {
      console.log('❌ Campos obrigatórios faltando');
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validação de UUID para salon_id
    function isUUID(str) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    }
    if (!isUUID(salon_id)) {
      console.log('❌ salon_id inválido:', salon_id);
      return new Response(JSON.stringify({
        error: 'salon_id inválido (não é UUID)'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Service Role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({
        error: 'Server configuration error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // Criar usuário com senha fornecida
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role: 'profissional',
        salon_id
      },
      email_confirm: true
    });
    if (authError) {
      return new Response(JSON.stringify({
        error: `Failed to create user: ${authError.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!authData.user) {
      return new Response(JSON.stringify({
        error: 'User creation failed'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Inserir na tabela users
    const { error: userError } = await supabaseAdmin.from('users').insert([
      {
        id: authData.user.id,
        email: email,
        nome: name,
        telefone: phone || 'Não informado',
        tipo: 'funcionario',
        salao_id: salon_id
      }
    ]);
    if (userError) {
      // rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({
        error: `Failed to insert user: ${userError.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Inserir em employees
    const { error: professionalError } = await supabaseAdmin.from('employees').insert([
      {
        id: authData.user.id,
        user_id: authData.user.id,
        salao_id: salon_id,
        nome: name,
        email: email,
        telefone: phone || 'Não informado',
        cargo: cargo || 'Profissional',
        percentual_comissao: percentual_comissao || 0,
        ativo: true
      }
    ]);
    if (professionalError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({
        error: `Failed to insert professional: ${professionalError.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      message: 'Profissional criado com sucesso',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: 'profissional',
        salon_id
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: `Internal server error: ${error.message}`
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
