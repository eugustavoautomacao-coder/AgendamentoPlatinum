import { useEffect } from 'react';
import { useLembretesAutomaticos } from '@/hooks/useLembretesAutomaticos';

interface EmailNotificationManagerProps {
  enabled?: boolean;
  intervalMinutes?: number;
  reminderHours?: number[];
}

export const EmailNotificationManager: React.FC<EmailNotificationManagerProps> = ({
  enabled = true,
  intervalMinutes = 30,
  reminderHours = [24, 2] // 24h e 2h antes
}) => {
  const { iniciarLembretes, pararLembretes } = useLembretesAutomaticos({
    enabled,
    intervalMinutes,
    reminderHours
  });

  useEffect(() => {
    if (enabled) {
      iniciarLembretes();
    } else {
      pararLembretes();
    }

    return () => {
      pararLembretes();
    };
  }, [enabled, iniciarLembretes, pararLembretes]);

  // Este componente não renderiza nada visual
  // Apenas gerencia os lembretes em background
  return null;
};
