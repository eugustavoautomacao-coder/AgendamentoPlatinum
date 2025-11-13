import { Redis } from '@upstash/redis';

// Configuração do Redis (Upstash)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Função para cache com TTL
export const cacheWithTTL = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300 // 5 minutos padrão
): Promise<T> => {
  try {
    // Tentar buscar do cache primeiro
    const cached = await redis.get(key);
    if (cached) {
      return cached as T;
    }

    // Se não estiver no cache, buscar dados
    const data = await fetchFn();
    
    // Armazenar no cache com TTL
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Erro no cache:', error);
    // Em caso de erro, buscar dados diretamente
    return await fetchFn();
  }
};

// Função para invalidar cache
export const invalidateCache = async (pattern: string) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Erro ao invalidar cache:', error);
  }
};
