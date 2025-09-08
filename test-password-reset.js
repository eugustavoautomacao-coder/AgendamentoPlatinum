// Script para testar o fluxo de recuperação de senha
// Execute este script no console do navegador na página de login

console.log('🧪 Teste do Fluxo de Recuperação de Senha');
console.log('=====================================');

// Função para testar o envio de email
async function testPasswordResetFlow() {
  try {
    console.log('1️⃣ Testando envio de email de recuperação...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    const email = prompt('Digite um email para testar a recuperação de senha:');
    if (!email) {
      console.log('❌ Teste cancelado - email não fornecido');
      return;
    }
    
    console.log('📧 Enviando email para:', email);
    
    const redirectTo = `${window.location.origin}/redefinir-senha`;
    console.log('🔗 URL de redirecionamento:', redirectTo);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });
    
    if (error) {
      console.error('❌ Erro ao enviar email:', error);
      alert(`Erro: ${error.message}`);
    } else {
      console.log('✅ Email enviado com sucesso!');
      console.log('📋 Próximos passos:');
      console.log('1. Verifique sua caixa de entrada');
      console.log('2. Verifique a pasta de spam');
      console.log('3. Clique no link do email');
      console.log('4. Você será redirecionado para a página de redefinição');
      
      alert('Email enviado! Verifique sua caixa de entrada e spam.');
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    alert(`Erro inesperado: ${error.message}`);
  }
}

// Função para verificar configurações
function checkConfiguration() {
  console.log('🔍 Verificando configurações...');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('✅ Supabase URL:', supabaseUrl ? 'Configurado' : '❌ Não configurado');
  console.log('✅ Supabase Key:', supabaseKey ? 'Configurado' : '❌ Não configurado');
  console.log('✅ URL atual:', window.location.origin);
  console.log('✅ É localhost?', window.location.hostname === 'localhost');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Configurações do Supabase não encontradas!');
    return false;
  }
  
  return true;
}

// Função para simular URL de recuperação
function simulateRecoveryURL() {
  console.log('🔗 Simulando URL de recuperação...');
  
  // URL de exemplo (não funcional, apenas para demonstração)
  const exampleURL = `${window.location.origin}/redefinir-senha?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&type=recovery`;
  
  console.log('📋 URL de exemplo (não funcional):');
  console.log(exampleURL);
  console.log('');
  console.log('💡 Esta é a estrutura que o Supabase gera automaticamente');
  console.log('💡 O link real virá no email de recuperação');
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes...');
  
  // Verificar configurações
  if (!checkConfiguration()) {
    return;
  }
  
  console.log('');
  console.log('📋 Menu de testes:');
  console.log('1. testPasswordResetFlow() - Testar envio de email');
  console.log('2. simulateRecoveryURL() - Ver estrutura da URL');
  console.log('3. checkConfiguration() - Verificar configurações');
  console.log('');
  
  // Executar teste principal
  await testPasswordResetFlow();
  
  // Mostrar estrutura da URL
  simulateRecoveryURL();
}

// Adicionar funções ao escopo global
window.testPasswordResetFlow = testPasswordResetFlow;
window.simulateRecoveryURL = simulateRecoveryURL;
window.checkConfiguration = checkConfiguration;
window.runTests = runTests;

// Executar automaticamente
runTests();

console.log('');
console.log('🎯 Para executar testes individuais:');
console.log('- runTests() - Executar todos os testes');
console.log('- testPasswordResetFlow() - Testar envio de email');
console.log('- checkConfiguration() - Verificar configurações');


