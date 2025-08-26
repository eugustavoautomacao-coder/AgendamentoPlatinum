import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SalonInfo {
  id: string;
  nome: string;
  email?: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  working_hours?: Record<string, { open: string; close: string; active: boolean }>;
}

export function useSalonInfo() {
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const fetchSalonInfo = async (forceRefresh = false) => {
    if (!profile?.salao_id) {
      setSalonInfo(null);
      return;
    }

    // Se não for force refresh, verificar cache local primeiro
    if (!forceRefresh) {
      const cachedSalon = localStorage.getItem(`salon_${profile.salao_id}`);
      if (cachedSalon) {
        try {
          const parsedSalon = JSON.parse(cachedSalon);
          // Verificar se o cache não expirou (24 horas)
          const cacheTime = localStorage.getItem(`salon_${profile.salao_id}_time`);
          if (cacheTime && (Date.now() - parseInt(cacheTime)) < 24 * 60 * 60 * 1000) {
            setSalonInfo(parsedSalon);
            return;
          }
        } catch (error) {
          // Cache inválido, continuar com fetch
        }
      }
    }

    try {
      setLoading(true);
      console.log('Buscando dados do salão:', profile.salao_id);
      
      const { data, error } = await supabase
        .from('saloes')
        .select('id, nome, email, cnpj, telefone, endereco, working_hours')
        .eq('id', profile.salao_id)
        .single();

      if (error) throw error;
      
      console.log('Dados do salão carregados:', data);
      
      // Salvar no cache local
      localStorage.setItem(`salon_${profile.salao_id}`, JSON.stringify(data));
      localStorage.setItem(`salon_${profile.salao_id}_time`, Date.now().toString());
      
      setSalonInfo(data);
    } catch (error) {
      console.error('Error fetching salon info:', error);
      setSalonInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalonInfo();
  }, [profile?.salao_id]);

  // Usar nome do salão do perfil (disponível imediatamente) ou dados completos do salão
  const salonName = profile?.salao_nome || salonInfo?.nome || 'Salão';

  return { 
    salonInfo, 
    loading,
    salonName, // Sempre disponível, sem loading
    refetchSalonInfo: fetchSalonInfo
  };
}