import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('🚀 Edge Function create-client iniciada');
    // Obter dados do request
    const requestBody = await req.json();
    const { name, email, phone, observacoes, salon_id } = requestBody;
    console.log('📝 Dados recebidos:', {
      name,
      email,
      phone,
      observacoes,
      salon_id
    });
    // Validação básica
    if (!name || !email || !salon_id) {
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
      console.log('❌ Configuração do servidor faltando');
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
    // Gerar senha aleatória
    const password = Math.random().toString(36).slice(-10) + 'Aa1!';
    console.log('🔑 Senha gerada:', password);
    // Criar usuário
    console.log('👤 Criando usuário...');
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
    if (authError) {
      console.log('❌ Erro ao criar usuário:', authError);
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
      console.log('❌ authData.user não retornado');
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
    console.log('✅ Usuário criado:', authData.user.id);
    // Criar cliente na tabela clientes
    console.log('📝 Criando cliente na tabela clientes...');
    const { error: insertError } = await supabaseAdmin.from('clientes').insert({
      id: authData.user.id,
      salao_id: salon_id,
      nome: name,
      email: email,
      telefone: phone || 'Não informado',
      senha_hash: password,
      senha_temporaria: true,
      ativo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    });
    if (insertError) {
      console.log('❌ Erro ao inserir cliente:', insertError);
      // Limpar usuário criado
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({
        error: `Failed to insert client: ${insertError.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ Profile atualizado/inserido com sucesso');
    // Retornar sucesso
    const response = {
      message: 'Cliente criado com sucesso',
      password: password,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: 'cliente',
        salon_id
      }
    };
    console.log('🎉 Cliente criado com sucesso!');
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.log('❌ Erro inesperado:', error);
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
