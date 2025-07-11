import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SalonInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function useSalonInfo() {
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchSalonInfo = async () => {
      if (!profile?.salon_id) {
        setSalonInfo(null);
        return;
      }

      // Verificar cache local primeiro
      const cachedSalon = localStorage.getItem(`salon_${profile.salon_id}`);
      if (cachedSalon) {
        try {
          const parsedSalon = JSON.parse(cachedSalon);
          // Verificar se o cache não expirou (24 horas)
          const cacheTime = localStorage.getItem(`salon_${profile.salon_id}_time`);
          if (cacheTime && (Date.now() - parseInt(cacheTime)) < 24 * 60 * 60 * 1000) {
            setSalonInfo(parsedSalon);
            return;
          }
        } catch (error) {
          // Cache inválido, continuar com fetch
        }
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('salons')
          .select('id, name, email, phone, address')
          .eq('id', profile.salon_id)
          .single();

        if (error) throw error;
        
        // Salvar no cache local
        localStorage.setItem(`salon_${profile.salon_id}`, JSON.stringify(data));
        localStorage.setItem(`salon_${profile.salon_id}_time`, Date.now().toString());
        
        setSalonInfo(data);
      } catch (error) {
        console.error('Error fetching salon info:', error);
        setSalonInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSalonInfo();
  }, [profile?.salon_id]);

  // Usar nome do salão do perfil (disponível imediatamente) ou dados completos do salão
  const salonName = profile?.salon_name || salonInfo?.name || 'Salão';

  return { 
    salonInfo, 
    loading,
    salonName // Sempre disponível, sem loading
  };
}