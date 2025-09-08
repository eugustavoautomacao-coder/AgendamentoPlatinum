// Script para testar o link do Supabase diretamente
// Execute este script no console do navegador

console.log('🧪 Teste do Link do Supabase');
console.log('============================');

// Função para testar o link do Supabase
async function testSupabaseLink() {
  try {
    console.log('🔗 Testando link do Supabase...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // URL do link que você recebeu
    const supabaseUrl = 'https://lbpqmdcmoybuuthzezmj.supabase.co/auth/v1/verify?token=8060749ee06bd69ab3d9a5adf42a51d8da86636ed190a78c12db7bd0&type=recovery&redirect_to=http://localhost:8080/redefinir-senha';
    
    console.log('📧 Link do Supabase:', supabaseUrl);
    
    // Simular o processo de verificação
    const url = new URL(supabaseUrl);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');
    const redirectTo = url.searchParams.get('redirect_to');
    
    console.log('🔍 Parâmetros extraídos:');
    console.log('- Token:', token);
    console.log('- Type:', type);
    console.log('- Redirect To:', redirectTo);
    
    if (token && type === 'recovery') {
      console.log('✅ Token de recuperação encontrado');
      console.log('🔄 Simulando redirecionamento...');
      
      // Simular o que acontece quando o Supabase redireciona
      const redirectUrl = `${redirectTo}#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&type=recovery`;
      
      console.log('🔗 URL de redirecionamento simulada:', redirectUrl);
      console.log('');
      console.log('💡 O Supabase deveria redirecionar para uma URL similar a esta');
      console.log('💡 Com os tokens de acesso no hash da URL');
      
      // Testar se conseguimos acessar a página
      console.log('');
      console.log('🧪 Testando acesso à página...');
      
      // Simular parâmetros no hash
      const testHash = '#access_token=test_token&refresh_token=test_refresh&type=recovery';
      const testUrl = `${redirectTo}${testHash}`;
      
      console.log('🔗 URL de teste:', testUrl);
      console.log('');
      console.log('📋 Para testar manualmente:');
      console.log('1. Copie a URL de teste acima');
      console.log('2. Cole no navegador');
      console.log('3. Verifique se a página carrega corretamente');
      
    } else {
      console.log('❌ Token de recuperação não encontrado ou inválido');
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Função para verificar configurações do Supabase
function checkSupabaseConfig() {
  console.log('🔍 Verificando configurações...');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('✅ Supabase URL:', supabaseUrl);
  console.log('✅ Supabase Key:', supabaseKey ? 'Configurado' : 'Não configurado');
  console.log('✅ URL atual:', window.location.origin);
  
  if (supabaseUrl !== 'https://lbpqmdcmoybuuthzezmj.supabase.co') {
    console.log('⚠️ ATENÇÃO: URL do Supabase não confere com o link do email!');
    console.log('⚠️ Link do email:', 'https://lbpqmdcmoybuuthzezmj.supabase.co');
    console.log('⚠️ URL configurada:', supabaseUrl);
  }
}

// Função para simular o fluxo completo
async function simulateFullFlow() {
  console.log('🎭 Simulando fluxo completo...');
  
  // 1. Verificar configurações
  checkSupabaseConfig();
  
  console.log('');
  
  // 2. Testar link
  await testSupabaseLink();
  
  console.log('');
  console.log('📋 Próximos passos:');
  console.log('1. Verifique se as URLs do Supabase estão corretas');
  console.log('2. Teste o link manualmente no navegador');
  console.log('3. Verifique se os parâmetros estão sendo passados corretamente');
  console.log('4. Configure as URLs de redirecionamento no Supabase Dashboard');
}

// Adicionar funções ao escopo global
window.testSupabaseLink = testSupabaseLink;
window.checkSupabaseConfig = checkSupabaseConfig;
window.simulateFullFlow = simulateFullFlow;

// Executar automaticamente
simulateFullFlow();

console.log('');
console.log('🎯 Para executar testes individuais:');
console.log('- simulateFullFlow() - Simular fluxo completo');
console.log('- testSupabaseLink() - Testar link do Supabase');
console.log('- checkSupabaseConfig() - Verificar configurações');


