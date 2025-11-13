/**
 * Handler para gerenciar redirecionamentos do Supabase
 * Resolve problemas de parâmetros de autenticação não sendo passados corretamente
 */

export interface SupabaseAuthParams {
  access_token?: string;
  refresh_token?: string;
  type?: string;
  error?: string;
  error_description?: string;
}

/**
 * Extrai parâmetros de autenticação da URL (query string e hash)
 */
export function extractAuthParams(): SupabaseAuthParams {
  const params: SupabaseAuthParams = {};
  
  // Verificar query string
  const searchParams = new URLSearchParams(window.location.search);
  params.access_token = searchParams.get('access_token') || undefined;
  params.refresh_token = searchParams.get('refresh_token') || undefined;
  params.type = searchParams.get('type') || undefined;
  params.error = searchParams.get('error') || undefined;
  params.error_description = searchParams.get('error_description') || undefined;
  
  // Verificar hash (fragmento da URL)
  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    params.access_token = hashParams.get('access_token') || params.access_token;
    params.refresh_token = hashParams.get('refresh_token') || params.refresh_token;
    params.type = hashParams.get('type') || params.type;
    params.error = hashParams.get('error') || params.error;
    params.error_description = hashParams.get('error_description') || params.error_description;
  }
  
  return params;
}

/**
 * Verifica se a URL contém parâmetros de autenticação válidos
 */
export function hasValidAuthParams(): boolean {
  const params = extractAuthParams();
  return !!(params.access_token && params.type === 'recovery');
}

/**
 * Limpa a URL removendo parâmetros de autenticação
 */
export function cleanAuthParams(): void {
  if (window.location.hash) {
    // Limpar hash
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  
  if (window.location.search) {
    // Limpar query string
    window.history.replaceState(null, '', window.location.pathname);
  }
}

/**
 * Logs detalhados para debug
 */
export function logAuthDebug(): void {
  console.log('🔍 === DEBUG SUPABASE AUTH ===');
  console.log('URL completa:', window.location.href);
  console.log('Hostname:', window.location.hostname);
  console.log('Port:', window.location.port);
  console.log('Pathname:', window.location.pathname);
  console.log('Search:', window.location.search);
  console.log('Hash:', window.location.hash);
  console.log('Origin:', window.location.origin);
  
  const params = extractAuthParams();
  console.log('Parâmetros extraídos:', params);
  console.log('Tem parâmetros válidos:', hasValidAuthParams());
  console.log('🔍 === FIM DEBUG ===');
}

/**
 * Cria uma URL de redirecionamento manual para o Supabase
 * Útil para casos onde o redirecionamento automático falha
 */
export function createManualRedirectUrl(supabaseUrl: string, token: string, redirectTo: string): string {
  const url = new URL('/auth/v1/verify', supabaseUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('type', 'recovery');
  url.searchParams.set('redirect_to', redirectTo);
  return url.toString();
}

/**
 * Intercepta cliques em links do Supabase e força o redirecionamento correto
 */
export function interceptSupabaseLinks(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href.includes('supabase.co/auth/v1/verify')) {
      event.preventDefault();
      
      console.log('🔗 Interceptando link do Supabase:', link.href);
      
      // Extrair parâmetros do link
      const url = new URL(link.href);
      const token = url.searchParams.get('token');
      const type = url.searchParams.get('type');
      const redirectTo = url.searchParams.get('redirect_to');
      
      if (token && type === 'recovery' && redirectTo) {
        // Forçar redirecionamento com parâmetros corretos
        const redirectUrl = `${redirectTo}#access_token=${token}&type=${type}`;
        console.log('🔄 Redirecionando para:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
        console.error('❌ Link do Supabase inválido');
        window.location.href = link.href;
      }
    }
  });
}
