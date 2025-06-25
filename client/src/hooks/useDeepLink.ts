import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { queryClient } from '@/lib/queryClient';

export function useDeepLink() {
  useEffect(() => {
    const handleAppUrlOpen = async (event: any) => {
      const url = event.url;
      
      // Check if this is an authentication success callback
      if (url && url.includes('myroommate://auth/success')) {
        // Authentication was successful, invalidate auth queries to refetch user data
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
        
        // Small delay to ensure queries complete before navigation
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };

    // Register the deep link listener
    App.addListener('appUrlOpen', handleAppUrlOpen);

    return () => {
      App.removeAllListeners();
    };
  }, []);
}