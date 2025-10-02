/**
 * Interceptador de links do Supabase para forçar redirecionamento correto
 * Resolve o problema de parâmetros não sendo passados
 */

export interface SupabaseLink {
  token: string;
  type: string;
  redirectTo: string;
  originalUrl: string;
}

/**
 * Extrai informações do link do Supabase
 */
export function parseSupabaseLink(url: string): SupabaseLink | null {
  try {
    const urlObj = new URL(url);
    
    // Verificar se é um link do Supabase
    if (!urlObj.hostname.includes('supabase.co') || !urlObj.pathname.includes('/auth/v1/verify')) {
      return null;
    }
    
    const token = urlObj.searchParams.get('token');
    const type = urlObj.searchParams.get('type');
    const redirectTo = urlObj.searchParams.get('redirect_to');
    
    if (!token || !type || !redirectTo) {
      return null;
    }
    
    return {
      token,
      type,
      redirectTo,
      originalUrl: url
    };
  } catch (error) {
    console.error('Erro ao analisar link do Supabase:', error);
    return null;
  }
}

/**
 * Cria uma URL de redirecionamento manual com parâmetros corretos
 */
export function createManualRedirectUrl(link: SupabaseLink): string {
  // Se o tipo for recovery, criar URL com parâmetros no hash
  if (link.type === 'recovery') {
    return `${link.redirectTo}#access_token=${link.token}&type=${link.type}`;
  }
  
  // Para outros tipos, usar query string
  const url = new URL(link.redirectTo);
  url.searchParams.set('access_token', link.token);
  url.searchParams.set('type', link.type);
  return url.toString();
}

/**
 * Intercepta cliques em links e força redirecionamento correto
 */
export function interceptSupabaseLinks(): void {
  // Interceptar cliques em links
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href) {
      const supabaseLink = parseSupabaseLink(link.href);
      
      if (supabaseLink) {
        event.preventDefault();
        console.log('🔗 Interceptando link do Supabase:', link.href);
        
        const redirectUrl = createManualRedirectUrl(supabaseLink);
        console.log('🔄 Redirecionando para:', redirectUrl);
        
        // Redirecionar para a URL correta
        window.location.href = redirectUrl;
      }
    }
  });
  
  // Interceptar mudanças de URL (para casos de redirecionamento automático)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      
      // Verificar se a URL mudou para um link do Supabase
      const supabaseLink = parseSupabaseLink(currentUrl);
      if (supabaseLink) {
        console.log('🔄 URL mudou para link do Supabase, redirecionando...');
        const redirectUrl = createManualRedirectUrl(supabaseLink);
        window.location.href = redirectUrl;
      }
    }
  });
  
  observer.observe(document, { subtree: true, childList: true });
}

/**
 * Processa um link do Supabase manualmente
 */
export function processSupabaseLink(url: string): void {
  const link = parseSupabaseLink(url);
  
  if (link) {
    console.log('✅ Link do Supabase válido encontrado:', link);
    const redirectUrl = createManualRedirectUrl(link);
    console.log('🔄 Redirecionando para:', redirectUrl);
    window.location.href = redirectUrl;
  } else {
    console.error('❌ Link do Supabase inválido:', url);
  }
}

/**
 * Cria um botão para processar links manualmente
 */
export function createLinkProcessorButton(): HTMLElement {
  const button = document.createElement('button');
  button.textContent = '🔗 Processar Link do Supabase';
  button.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
  
  button.addEventListener('click', () => {
    const url = prompt('Cole o link do Supabase aqui:');
    if (url) {
      processSupabaseLink(url);
    }
  });
  
  return button;
}








