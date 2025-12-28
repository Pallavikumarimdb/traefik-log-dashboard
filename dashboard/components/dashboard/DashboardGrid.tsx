'use client';

import { Activity, Clock, AlertTriangle, Server } from 'lucide-react';
import { DashboardMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

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
import RecentLogsTable from './cards/RecentLogsTable';
import ErrorsCard from './cards/ErrorsCard';
import StatusCodesCard from './cards/StatusCodesCard';
import ResponseTimeCard from './cards/ResponseTimeCard';
import RequestsCard from './cards/RequestsCard';
import BackendsCard from './cards/BackendsCard';
import InteractiveGeoMap from './cards/InteractiveGeoMap';
import { CPUCard, MemoryCard, DiskCard } from './cards/SystemInfoCards';

import { SystemStats } from '@/lib/types';

interface DashboardGridProps {
  metrics: DashboardMetrics;
  systemStats?: SystemStats | null; // BEST PRACTICE FIX: Use proper type instead of any
  demoMode?: boolean;
}

export default function DashboardGrid({ metrics, systemStats }: DashboardGridProps) {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={formatNumber(metrics.requests.total)}
          description={`${metrics.requests.perSecond.toFixed(2)} req/s`}
          icon={<Activity className="h-5 w-5 text-red-600" />}
        />
        <StatCard
          title="Response Time"
          value={`${metrics.responseTime.average.toFixed(0)}ms`}
          description={`P99: ${metrics.responseTime.p99.toFixed(0)}ms`}
          icon={<Clock className="h-5 w-5 text-red-600" />}
        />
        <StatCard
          title="Success Rate"
          value={`${(100 - metrics.statusCodes.errorRate).toFixed(1)}%`}
          description={`${formatNumber(metrics.statusCodes.status2xx + metrics.statusCodes.status3xx)} successful`}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        />
        <StatCard
          title="Active Services"
          value={metrics.backends.length}
          description="Services with traffic"
          icon={<Server className="h-5 w-5 text-red-600" />}
        />
      </div>

      {/* System Info Cards */}
      {systemStats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CPUCard stats={systemStats} />
          <MemoryCard stats={systemStats} />
          <DiskCard stats={systemStats} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RequestsCard metrics={metrics.requests} />
        <ResponseTimeCard metrics={metrics.responseTime} />
        <StatusCodesCard metrics={metrics.statusCodes} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <StatusCodeDistributionCard metrics={metrics.statusCodes} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TimelineCard timeline={metrics.timeline} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TopRoutesCard routes={metrics.topRoutes} />
        <TopServicesCard services={metrics.backends} />
        <RoutersCard routers={metrics.routers} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <BackendsCard backends={metrics.backends} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TopClientIPsCard clients={metrics.topClientIPs} />
        <TopRequestHostsCard hosts={metrics.topRequestHosts} />
        <TopRequestAddressesCard addresses={metrics.topRequestAddresses} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <UserAgentsCard userAgents={metrics.userAgents} />
      </div>

      {/* FIX for Issue #140: Removed redundant GeographicDistributionCard - InteractiveGeoMap already shows geographic distribution */}
      <div className="grid grid-cols-1 gap-6">
        <InteractiveGeoMap locations={metrics.geoLocations} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ErrorsCard errors={metrics.errors} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentLogsTable logs={metrics.logs} />
      </div>
    </div>
  );
}