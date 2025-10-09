'use client';

import { Activity, Clock, AlertTriangle, Server } from 'lucide-react';
import { DashboardMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

// Import all card components
import StatCard from './cards/StatCard';
import TimelineCard from './cards/TimelineCard';
import StatusCodeDistributionCard from './cards/StatusCodeDistributionCard';
import TopServicesCard from './cards/TopServicesCard';
import TopRoutesCard from './cards/TopRoutesCard';
import RoutersCard from './cards/RoutersCard';
import TopClientIPsCard from './cards/TopClientIPsCard';
import TopRequestHostsCard from './cards/TopRequestHostsCard';
import TopRequestAddressesCard from './cards/TopRequestAddressesCard';
import UserAgentsCard from './cards/UserAgentsCard';
import InteractiveGeoMap from './cards/InteractiveGeoMap';
import RecentLogsTable from './cards/RecentLogsTable';
import ErrorsCard from './cards/ErrorsCard';

interface DashboardGridProps {
  metrics: DashboardMetrics;
  demoMode?: boolean;
}

export default function DashboardGrid({ metrics, demoMode = false }: DashboardGridProps) {
  return (
    <div className="w-full space-y-6">
      {/* Row 1: Key Metrics - 4 columns */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={formatNumber(metrics.requests.total)}
          description={`${metrics.requests.perSecond.toFixed(2)} req/s`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Response Time"
          value={`${metrics.responseTime.average.toFixed(0)}ms`}
          description={`P99: ${metrics.responseTime.p99.toFixed(0)}ms`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Success Rate"
          value={`${(100 - metrics.statusCodes.errorRate).toFixed(1)}%`}
          description={`${formatNumber(metrics.statusCodes.status2xx + metrics.statusCodes.status3xx)} successful`}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Active Services"
          value={metrics.backends.length}
          description="Services with traffic"
          icon={<Server className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Row 2: Status Code Distribution */}
      <div className="grid grid-cols-1 gap-6">
        <StatusCodeDistributionCard metrics={metrics.statusCodes} />
      </div>

      {/* Row 3: Request Timeline - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <TimelineCard timeline={metrics.timeline} />
      </div>

      {/* Row 4: Top Routes, Services, Routers - 3 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TopRoutesCard routes={metrics.topRoutes} />
        <TopServicesCard services={metrics.backends} />
        <RoutersCard routers={metrics.routers} />
      </div>

      {/* Row 5: Client IPs, Request Hosts, Request Addresses - 3 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TopClientIPsCard clients={metrics.topClientIPs} />
        <TopRequestHostsCard hosts={metrics.topRequestHosts} />
        <TopRequestAddressesCard addresses={metrics.topRequestAddresses} />
      </div>

      {/* Row 6: User Agents - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <UserAgentsCard userAgents={metrics.userAgents} />
      </div>

      {/* Row 7: Geographic Distribution and Recent Errors - 2 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InteractiveGeoMap locations={metrics.geoLocations} />
        <ErrorsCard errors={metrics.errors} />
      </div>

      {/* Row 8: Recent Logs Table - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <RecentLogsTable logs={metrics.logs} />
      </div>
    </div>
  );
}