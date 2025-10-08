'use client';

import { Activity, Clock, AlertTriangle, Server } from 'lucide-react';
import { DashboardMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

// Consolidated Imports for all cards
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
import InteractiveGeoMap from './cards/InteractiveGeoMap'; // Using the interactive map
import RecentLogsTable from './cards/RecentLogsTable';
import ErrorsCard from './cards/ErrorsCard';


interface DashboardGridProps {
  metrics: DashboardMetrics;
  demoMode?: boolean;
}

export default function DashboardGrid({ metrics, demoMode = false }: DashboardGridProps) {
  return (
    <div className="space-y-6">
      {/* Top Row: Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Requests"
          value={formatNumber(metrics.requests.total)}
          description={`${metrics.requests.perSecond.toFixed(2)} req/s`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Avg Response Time"
          value={`${metrics.responseTime.average.toFixed(0)}ms`}
          description={`P99: ${metrics.responseTime.p99.toFixed(0)}ms`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Error Rate"
          value={`${metrics.statusCodes.errorRate.toFixed(1)}%`}
          description={`${formatNumber(metrics.statusCodes.status4xx + metrics.statusCodes.status5xx)} errors`}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Active Services"
          value={metrics.backends.length}
          description="Services with traffic"
          icon={<Server className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Second Row: Timeline */}
      <TimelineCard timeline={metrics.timeline} />

      {/* Third Row: Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopRoutesCard routes={metrics.topRoutes} />
        <TopServicesCard services={metrics.backends} />
        <RoutersCard routers={metrics.routers} />
      </div>

      {/* Fourth Row: Client & Request Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopClientIPsCard clients={metrics.topClientIPs} />
        <TopRequestHostsCard hosts={metrics.topRequestHosts} />
        <TopRequestAddressesCard addresses={metrics.topRequestAddresses} />
      </div>

      {/* Fifth Row: Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <StatusCodeDistributionCard metrics={metrics.statusCodes} />
        </div>
        <div className="lg:col-span-2">
            <UserAgentsCard userAgents={metrics.userAgents} />
        </div>
      </div>
      
      {/* Sixth Row: Geography & Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveGeoMap locations={metrics.geoLocations} />
        <ErrorsCard errors={metrics.errors} />
      </div>

      {/* Final Row: Recent Logs Table */}
      <RecentLogsTable logs={metrics.logs} />
    </div>
  );
}