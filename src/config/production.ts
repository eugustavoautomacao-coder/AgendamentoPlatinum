// Configurações específicas para produção
export const productionConfig = {
  // Configurações de cache
  cache: {
    defaultTTL: 300, // 5 minutos
    maxTTL: 3600, // 1 hora
    minTTL: 60, // 1 minuto
  },
  
  // Configurações de performance
  performance: {
    enableMonitoring: true,
    enableCompression: true,
    enableOptimization: true,
    maxConcurrentRequests: 10,
  },
  
  // Configurações de paginação
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    minPageSize: 5,
  },
  
  // Configurações de imagem
  images: {
    defaultQuality: 0.8,
    maxWidth: 800,
    maxHeight: 600,
    formats: ['webp', 'avif'],
  },
  
  // Configurações de monitoramento
  monitoring: {
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    enableUserTracking: true,
    sampleRate: 0.1, // 10% dos usuários
  },
  
  // Configurações de segurança
  security: {
    enableCORS: true,
    enableCSRF: true,
    enableRateLimiting: true,
    maxRequestsPerMinute: 100,
  },
};

// Função para obter configuração baseada no ambiente
export const getConfig = () => {
  // Sempre usar configurações de produção por enquanto
  return productionConfig;
};
