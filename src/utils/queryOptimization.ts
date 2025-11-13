import { supabase } from '@/integrations/supabase/client';

// Função para buscar dados com paginação
export const fetchWithPagination = async (
  table: string,
  filters: any = {},
  page: number = 1,
  pageSize: number = 20
) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })
    .range(from, to);

  // Aplicar filtros
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  const { data, error, count } = await query;

  return {
    data: data || [],
    error,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
    currentPage: page,
  };
};

// Função para buscar dados com cache e paginação
export const fetchCachedWithPagination = async (
  cacheKey: string,
  table: string,
  filters: any = {},
  page: number = 1,
  pageSize: number = 20,
  ttlSeconds: number = 300
) => {
  const cacheKeyWithPage = `${cacheKey}:page:${page}:size:${pageSize}`;
  
  // Verificar cache primeiro
  const cached = localStorage.getItem(cacheKeyWithPage);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Se cache ainda é válido (menos de TTL segundos)
    if (now - timestamp < ttlSeconds * 1000) {
      return data;
    }
  }

  // Buscar dados do banco
  const result = await fetchWithPagination(table, filters, page, pageSize);
  
  // Armazenar no cache
  localStorage.setItem(cacheKeyWithPage, JSON.stringify({
    data: result,
    timestamp: Date.now(),
  }));

  return result;
};

// Função para invalidar cache de paginação
export const invalidatePaginationCache = (cacheKey: string) => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(cacheKey)) {
      localStorage.removeItem(key);
    }
  });
};

// Função para buscar dados com joins otimizados
export const fetchWithOptimizedJoins = async (
  table: string,
  selectFields: string,
  filters: any = {}
) => {
  let query = supabase
    .from(table)
    .select(selectFields);

  // Aplicar filtros
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query;
  return { data, error };
};
