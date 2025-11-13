// Configurações de ambiente para otimizações
export const env = {
  // Performance (valores padrão)
  CACHE_TTL: 300, // 5 minutos
  PAGE_SIZE: 20,
  IMAGE_QUALITY: 0.8,
  
  // Monitoramento (ativado por padrão)
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_CACHE: true,
  
  // Supabase (será preenchido pelo cliente)
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
};

// Validar configurações
export const validateEnv = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Variáveis de ambiente faltando:', missing);
  }
  
  return missing.length === 0;
};
