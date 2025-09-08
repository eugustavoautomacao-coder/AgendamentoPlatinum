import { supabase } from '@/integrations/supabase/client';

export async function checkUserExists(email: string) {
  try {
    console.log('🔍 Verificando se usuário existe:', email);
    
    // Verificar na tabela public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id, email, nome, tipo')
      .eq('email', email)
      .single();
    
    if (publicError && publicError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário público:', publicError);
      return { exists: false, error: publicError.message };
    }
    
    if (publicUser) {
      console.log('✅ Usuário encontrado na tabela public.users:', publicUser);
      return { exists: true, user: publicUser, source: 'public.users' };
    }
    
    // Se não encontrou na tabela pública, verificar se existe no auth
    // (isso é mais complexo, mas podemos tentar)
    console.log('⚠️ Usuário não encontrado na tabela public.users');
    return { exists: false, error: 'Usuário não encontrado no sistema' };
    
  } catch (error: any) {
    console.error('💥 Erro inesperado ao verificar usuário:', error);
    return { exists: false, error: error.message };
  }
}


