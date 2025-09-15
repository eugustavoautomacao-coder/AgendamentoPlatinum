// Utilitários para detecção e tratamento de dispositivos móveis

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         (navigator as any).msMaxTouchPoints > 0;
};

export const getMobileInfo = () => {
  if (typeof window === 'undefined') return { isMobile: false, isTouch: false, userAgent: '' };
  
  return {
    isMobile: isMobile(),
    isTouch: isTouchDevice(),
    userAgent: navigator.userAgent,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight
  };
};

// Função para limpar dados de autenticação de forma mais robusta no mobile
export const clearAuthData = (): void => {
  try {
    // Limpar localStorage
    const keysToRemove = [
      'cliente_auth',
      'supabase.auth.token',
      'cliente_auth_backup',
      'supabase.auth.refresh_token',
      'supabase.auth.access_token'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Erro ao remover ${key}:`, error);
      }
    });
    
    // Limpar sessionStorage também
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Erro ao limpar sessionStorage:', error);
    }
    
    // Limpar cookies relacionados ao Supabase (se possível)
    try {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('supabase') || name.includes('auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar cookies:', error);
    }
    
  } catch (error) {
    console.error('Erro geral ao limpar dados de autenticação:', error);
  }
};

// Função para detectar problemas de conectividade
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    // Tentar fazer uma requisição simples para verificar conectividade
    const response = await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch (error) {
    // Se não conseguir fazer a requisição, assumir que há conectividade
    // pois o problema pode ser específico da API
    return true;
  }
};

// Função para aguardar com timeout
export const waitWithTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
};
