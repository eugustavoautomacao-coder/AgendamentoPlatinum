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
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchSalonInfo = async () => {
      if (!profile?.salon_id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('salons')
          .select('id, name, email, phone, address')
          .eq('id', profile.salon_id)
          .single();

        if (error) throw error;
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

  return { salonInfo, loading };
}