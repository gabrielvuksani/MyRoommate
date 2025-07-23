import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/lib/notifications';

export function useUnifiedNotifications() {
  const { user } = useAuth() as { user: any };
  
  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
    enabled: !!user?.id,
    staleTime: Infinity,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  }) as { data: any };

  useEffect(() => {
    if (!user?.id || !household?.id) return;

    // Initialize notification service and subscribe to push notifications
    const initNotifications = async () => {
      try {
        const permission = await notificationService.requestPermission();
        if (permission) {
          await notificationService.subscribeToPush();
          console.log('Unified notification system initialized');
        }
      } catch (error) {
        console.error('Failed to initialize unified notifications:', error);
      }
    };

    initNotifications();
  }, [user?.id, household?.id]);

  return {
    isReady: !!user?.id && !!household?.id
  };
}