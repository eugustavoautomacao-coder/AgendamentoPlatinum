import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // Handle preflight request for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  // 1. Validar o método da requisição
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Método não permitido"
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  try {
    // 2. Obter os dados do corpo da requisição
    const { nomeSalao, nomeAdmin, emailAdmin, senha, isSystemAdmin } = await req.json();
    // Define o tipo de usuário
    const userType = isSystemAdmin ? "system_admin" : "admin";
    // 3. Criar o cliente Supabase com a role de serviço para bypass RLS
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    // 4. Criar o salão primeiro
    const { data: salao, error: salaoError } = await supabaseAdmin.from("saloes").insert({
      nome: nomeSalao
    }).select().single();
    if (salaoError) throw salaoError;
    // 5. Criar o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailAdmin,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: nomeAdmin,
        tipo: userType
      }
    });
    if (authError) throw authError;
    const authUser = authData.user;
    if (!authUser) throw new Error("Usuário não foi criado no Auth");
    // 6. Vincular o usuário ao salão na tabela 'users'
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: authUser.id,
      nome: nomeAdmin,
      email: emailAdmin,
      salao_id: salao.id,
      tipo: userType
    });
    if (userError) throw userError;
    // 7. Retornar sucesso
    return new Response(JSON.stringify({
      message: "Salão e administrador criados com sucesso!",
      salao,
      user: authUser
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    // 8. Lidar com erros
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
