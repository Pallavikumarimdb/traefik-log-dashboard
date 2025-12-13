import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export function useSystemStats(demoMode: boolean) {
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // PERFORMANCE FIX: Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchSystemStats() {
      // PERFORMANCE FIX: Don't fetch when demo mode or tab not visible
      if (demoMode || !isTabVisible) return;

      try {
        const data = await apiClient.getSystemResources();
        if (isMounted) {
          setSystemStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    }

    fetchSystemStats();
    // PERFORMANCE FIX: Increased from 5s to 15s to reduce CPU load
    const interval = setInterval(fetchSystemStats, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [demoMode, isTabVisible]);

  return systemStats;
}
