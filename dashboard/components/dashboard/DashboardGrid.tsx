'use client';

import { DashboardMetrics } from '@/lib/types';
import RequestsCard from './cards/RequestsCard';
import ResponseTimeCard from './cards/ResponseTimeCard';
import StatusCodesCard from './cards/StatusCodesCard';
import TopRoutesCard from './cards/TopRoutesCard';
import BackendsCard from './cards/BackendsCard';
import RoutersCard from './cards/RoutersCard';
import GeoMapCard from './cards/GeoMapCard';
import ErrorsCard from './cards/ErrorsCard';
import UserAgentsCard from './cards/UserAgentsCard';
import TimelineCard from './cards/TimelineCard';

interface DashboardGridProps {
  metrics: DashboardMetrics;
  demoMode?: boolean;
}

export default function DashboardGrid({ metrics, demoMode = false }: DashboardGridProps) {
  console.log('Dashboard Metrics:', {
    requests: metrics.requests.total,
    routes: metrics.topRoutes.length,
    backends: metrics.backends.length,
    routers: metrics.routers.length,
    userAgents: metrics.userAgents.length,
    geoLocations: metrics.geoLocations.length,
    timeline: metrics.timeline.length,
    errors: metrics.errors.length,
  });

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RequestsCard metrics={metrics.requests} />
        <ResponseTimeCard metrics={metrics.responseTime} />
        <StatusCodesCard metrics={metrics.statusCodes} />
      </div>

      {/* Timeline */}
      <TimelineCard timeline={metrics.timeline} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopRoutesCard routes={metrics.topRoutes} />
        <BackendsCard backends={metrics.backends} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoutersCard routers={metrics.routers} />
        <UserAgentsCard userAgents={metrics.userAgents} />
      </div>

      {/* Geographic Map */}
      <GeoMapCard locations={metrics.geoLocations} />

      {/* Errors - Always show, even if empty */}
      {metrics.errors && metrics.errors.length > 0 && (
        <ErrorsCard errors={metrics.errors} />
      )}

      {/* Debug Info - Remove after testing */}
      {demoMode && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-xs">
          <div className="font-semibold mb-2">Debug Info:</div>
          <pre>{JSON.stringify(metrics, null, 2).substring(0, 500)}...</pre>
        </div>
      )}
    </div>
  );
}