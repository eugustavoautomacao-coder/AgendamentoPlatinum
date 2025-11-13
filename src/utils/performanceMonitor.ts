// Função para monitorar performance de queries
export const monitorQueryPerformance = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Enviar métricas para monitoramento (se configurado)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'query_performance', {
        query_name: queryName,
        duration: Math.round(duration),
      });
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Enviar erro para monitoramento
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'query_error', {
        query_name: queryName,
        duration: Math.round(duration),
        error: error.message,
      });
    }
    
    throw error;
  }
};

// Função para monitorar uso de memória
export const monitorMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize / 1024 / 1024; // MB
    const total = memory.totalJSHeapSize / 1024 / 1024; // MB
    const limit = memory.jsHeapSizeLimit / 1024 / 1024; // MB
    
    // Alertar se uso de memória estiver alto (apenas em desenvolvimento)
    if (used / limit > 0.8 && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ High memory usage detected!');
    }
  }
};

// Função para monitorar largura de banda
export const monitorBandwidth = () => {
  if (typeof window !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      // Ajustar qualidade baseada na conexão
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return 'low';
      } else if (connection.effectiveType === '3g') {
        return 'medium';
      } else {
        return 'high';
      }
    }
  }
  return 'high';
};

// Função para otimizar baseada na conexão
export const optimizeForConnection = (quality: string) => {
  const optimizations = {
    low: {
      imageQuality: 0.6,
      cacheTTL: 600, // 10 minutos
      pageSize: 10,
    },
    medium: {
      imageQuality: 0.8,
      cacheTTL: 300, // 5 minutos
      pageSize: 20,
    },
    high: {
      imageQuality: 0.9,
      cacheTTL: 120, // 2 minutos
      pageSize: 50,
    },
  };
  
  return optimizations[quality] || optimizations.high;
};
