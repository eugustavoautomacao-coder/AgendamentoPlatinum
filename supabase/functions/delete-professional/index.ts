import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'No authorization header'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Verificar se é admin ou system_admin
    const { data: profile, error: profileError } = await supabaseClient.from('users').select('tipo, salao_id').eq('id', user.id).single();
    if (profileError || !profile) {
      return new Response(JSON.stringify({
        error: 'User profile not found'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    const isSystemAdmin = profile.tipo === 'system_admin';
    const isAdmin = profile.tipo === 'admin';
    
    if (!isSystemAdmin && !isAdmin) {
      return new Response(JSON.stringify({
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Obter professionalId da URL ou body
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(part => part !== '');
    const professionalId = pathParts[pathParts.length - 1] || (await req.json().catch(() => ({}))).professionalId;
    
    if (!professionalId) {
      return new Response(JSON.stringify({
        error: 'Professional ID is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Se for admin (não system_admin), verificar se o profissional pertence ao mesmo salão
    if (isAdmin && !isSystemAdmin) {
      const { data: professional, error: profError } = await supabaseClient
        .from('employees')
        .select('salao_id')
        .eq('id', professionalId)
        .single();
      
      if (profError || !professional) {
        return new Response(JSON.stringify({
          error: 'Professional not found'
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (professional.salao_id !== profile.salao_id) {
        return new Response(JSON.stringify({
          error: 'Insufficient permissions - professional belongs to different salon'
        }), {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Service Role para operações administrativas
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
    // Ordem de exclusão: employees -> users -> auth.users
    // Isso evita problemas com foreign keys
    
    // 1. Primeiro, excluir da tabela employees
    const { error: deleteEmployeeError } = await supabaseAdmin.from('employees').delete().eq('id', professionalId);
    if (deleteEmployeeError) {
      return new Response(JSON.stringify({
        error: `Failed to delete from employees table: ${deleteEmployeeError.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // 2. Excluir da tabela users (usando Service Role para bypass RLS)
    const { data: userCheck } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', professionalId)
      .single();
    
    if (userCheck) {
      const { error: deleteUserError } = await supabaseAdmin.from('users').delete().eq('id', professionalId);
      if (deleteUserError) {
        return new Response(JSON.stringify({
          error: `Failed to delete from users table: ${deleteUserError.message}`
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // 3. Por último, excluir da tabela auth.users
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(professionalId);
    if (deleteAuthError) {
      return new Response(JSON.stringify({
        error: `Failed to delete user from auth: ${deleteAuthError.message}`,
        warning: 'Employee and user were deleted but auth user deletion failed'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Professional deleted successfully from all tables'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

