'use client';

import { useMemo } from 'react';
import DashboardGrid from './DashboardGrid';
import { TraefikLog } from '@/lib/types';
import { useMetricsProcessing } from '@/lib/hooks/useMetricsProcessing';
import { useGeoLocation } from '@/lib/hooks/useGeoLocation';
import { useSystemStats } from '@/lib/hooks/useSystemStats';
import { calculateMetrics, getEmptyMetrics } from '@/lib/utils/metric-calculator';
import { sortLogsByTime } from '@/lib/utils/log-utils';

interface DashboardProps {
  logs: TraefikLog[];
  demoMode?: boolean;
  agentId?: string;
  agentName?: string;
}

export default function Dashboard({ logs, demoMode = false, agentId, agentName }: DashboardProps) {
  const { geoLocations, isLoadingGeo } = useGeoLocation(logs);
  const systemStats = useSystemStats(demoMode);

  // PERFORMANCE FIX: Memoize sorted logs separately to prevent re-sorting on geoLocations change
  // REDUNDANCY FIX: Use shared utility function
  const sortedLogs = useMemo(() => {
    return sortLogsByTime(logs, 1000);
  }, [logs]);

  // PERFORMANCE FIX: Calculate metrics using memoized sortedLogs
  const metrics = useMemo(() => {
    if (sortedLogs.length === 0) {
      return getEmptyMetrics();
    }

    return calculateMetrics(sortedLogs, geoLocations);
  }, [sortedLogs, geoLocations]);

  // Process metrics for alerts and snapshots (only in non-demo mode)
  useMetricsProcessing(agentId || null, agentName || null, metrics, logs, {
    enabled: !demoMode,
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardGrid metrics={metrics} systemStats={systemStats} demoMode={demoMode} />
      
      {isLoadingGeo && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-3 z-50">
          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">Loading location data...</span>
        </div>
      )}
    </div>
  );
}

// REDUNDANCY FIX: Removed unused calculateTimeSpan and generateTimeline functions
// These functions were never called and were dead code