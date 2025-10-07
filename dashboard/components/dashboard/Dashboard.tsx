'use client';

import { useMemo } from 'react';
import DashboardGrid from './DashboardGrid';
import { TraefikLog, DashboardMetrics, AddressMetric, HostMetric, ClientMetric } from '@/lib/types';
import {
  calculateAverage,
  calculatePercentile,
  groupBy,
  parseUserAgent,
} from '@/lib/utils';
import { aggregateGeoLocations } from '@/lib/location';

interface DashboardProps {
  logs: TraefikLog[];
  demoMode?: boolean;
}

export default function Dashboard({ logs, demoMode = false }: DashboardProps) {
  const metrics = useMemo(() => {
    if (logs.length === 0) {
      return getEmptyMetrics();
    }

    return calculateMetrics(logs);
  }, [logs]);

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardGrid metrics={metrics} demoMode={demoMode} />
    </div>
  );
}

function calculateMetrics(logs: TraefikLog[]): DashboardMetrics {
  // Request metrics
  const total = logs.length;
  const timeSpan = calculateTimeSpan(logs);
  const perSecond = timeSpan > 0 ? total / timeSpan : 0;
    // Top Request Addresses
  const addressGroups = groupBy(logs.filter(l => l.RequestAddr), 'RequestAddr');
  const topRequestAddresses: AddressMetric[] = Object.entries(addressGroups)
    .map(([addr, addrLogs]) => ({
      addr,
      count: addrLogs.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top Request Hosts
  const hostGroups = groupBy(logs.filter(l => l.RequestHost), 'RequestHost');
  const topRequestHosts: HostMetric[] = Object.entries(hostGroups)
    .map(([host, hostLogs]) => ({
      host,
      count: hostLogs.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top Client IPs
  const clientIPGroups = groupBy(logs.filter(l => l.ClientHost), 'ClientHost');
  const topClientIPs: ClientMetric[] = Object.entries(clientIPGroups)
    .map(([ip, ipLogs]) => ({
      ip,
      count: ipLogs.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  // Response time metrics
  const durations = logs.map(log => log.Duration / 1000000);
  const avgDuration = calculateAverage(durations);
  const p95 = calculatePercentile(durations, 95);
  const p99 = calculatePercentile(durations, 99);

  // Status code metrics
  const statusGroups = groupBy(logs, 'DownstreamStatus');
  const status2xx = Object.keys(statusGroups)
    .filter(s => s.startsWith('2'))
    .reduce((sum, s) => sum + statusGroups[s].length, 0);
  const status3xx = Object.keys(statusGroups)
    .filter(s => s.startsWith('3'))
    .reduce((sum, s) => sum + statusGroups[s].length, 0);
  const status4xx = Object.keys(statusGroups)
    .filter(s => s.startsWith('4'))
    .reduce((sum, s) => sum + statusGroups[s].length, 0);
  const status5xx = Object.keys(statusGroups)
    .filter(s => s.startsWith('5'))
    .reduce((sum, s) => sum + statusGroups[s].length, 0);
  const errorRate = total > 0 ? ((status4xx + status5xx) / total) * 100 : 0;

  // Top routes
  const routeGroups = groupBy(logs, 'RequestPath');
  const topRoutes = Object.entries(routeGroups)
    .map(([path, pathLogs]) => ({
      path,
      count: pathLogs.length,
      avgDuration: calculateAverage(pathLogs.map(l => l.Duration / 1000000)),
      method: pathLogs[0].RequestMethod,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  

  // Backends
  const serviceGroups = groupBy(logs.filter(l => l.ServiceName), 'ServiceName');
  const backends = Object.entries(serviceGroups)
    .map(([name, serviceLogs]) => {
      const errors = serviceLogs.filter(l => l.DownstreamStatus >= 400).length;
      return {
        name,
        requests: serviceLogs.length,
        avgDuration: calculateAverage(serviceLogs.map(l => l.Duration / 1000000)),
        errorRate: serviceLogs.length > 0 ? (errors / serviceLogs.length) * 100 : 0,
        url: serviceLogs[0]?.ServiceURL || '',
      };
    })
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  // Routers
  const routerGroups = groupBy(logs.filter(l => l.RouterName), 'RouterName');
  const routers = Object.entries(routerGroups)
    .map(([name, routerLogs]) => ({
      name,
      requests: routerLogs.length,
      avgDuration: calculateAverage(routerLogs.map(l => l.Duration / 1000000)),
      service: routerLogs[0]?.ServiceName || '',
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  // Geographic locations
  const clientAddresses = logs.map(log => log.ClientAddr);
  const geoLocations = aggregateGeoLocations(clientAddresses);

  // User agents
  const userAgentGroups = groupBy(
    logs.filter(l => l.request_User_Agent),
    'request_User_Agent'
  );
  const userAgents = Object.entries(userAgentGroups)
    .map(([ua, uaLogs]) => {
      const parsed = parseUserAgent(ua);
      return {
        browser: parsed.browser || 'Unknown',
        count: uaLogs.length,
        percentage: (uaLogs.length / total) * 100,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Timeline
  const timeline = generateTimeline(logs);

  // Errors (logs with 4xx or 5xx status)
  const errors = logs
    .filter(l => l.DownstreamStatus >= 400)
    .slice(0, 10)
    .map(l => ({
      timestamp: l.StartUTC || l.StartLocal,
      level: l.DownstreamStatus >= 500 ? 'error' : 'warning',
      message: `${l.RequestMethod} ${l.RequestPath} - ${l.DownstreamStatus}`,
    }));

  return {
    requests: {
      total,
      perSecond,
      change: 0,
    },
    responseTime: {
      average: avgDuration,
      p95,
      p99,
      change: 0,
    },
    statusCodes: {
      status2xx,
      status3xx,
      status4xx,
      status5xx,
      errorRate,
    },
    topRoutes,
    backends,
    routers,
    geoLocations,
    userAgents,
    timeline,
    errors,
    logs, // <-- Ensure logs are included here
    topRequestAddresses, // <-- ADD THIS
    topRequestHosts,     // <-- ADD THIS
    topClientIPs,        // <-- ADD THIS
  };
}

function calculateTimeSpan(logs: TraefikLog[]): number {
  if (logs.length === 0) return 0;

  const timestamps = logs
    .map(l => new Date(l.StartUTC || l.StartLocal).getTime())
    .filter(t => !isNaN(t));

  if (timestamps.length === 0) return 0;

  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);

  return (max - min) / 1000; // Convert to seconds
}

function generateTimeline(logs: TraefikLog[]): { timestamp: string; value: number; label: string }[] {
  if (logs.length < 2) {
    return [];
  }

  const timestamps = logs
    .map(l => new Date(l.StartUTC || l.StartLocal).getTime())
    .filter(t => !isNaN(t));

  if (timestamps.length < 2) {
    return [];
  }

  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const points = 20;

  const effectiveMaxTime = Math.max(maxTime, minTime + 60 * 1000);
  const totalTimeSpan = effectiveMaxTime - minTime;
  const interval = Math.ceil(totalTimeSpan / points);

  const buckets: Map<number, number> = new Map();
  timestamps.forEach(logTime => {
    const bucketTime = Math.floor(logTime / interval) * interval;
    buckets.set(bucketTime, (buckets.get(bucketTime) || 0) + 1);
  });

  const startTime = Math.floor(minTime / interval) * interval;
  const endTime = Math.floor(maxTime / interval) * interval;

  const timelineData = [];

  for (let currentTime = startTime; currentTime <= endTime; currentTime += interval) {
    timelineData.push({
      timestamp: new Date(currentTime).toISOString(),
      value: buckets.get(currentTime) || 0,
      label: new Date(currentTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }

  return timelineData;
}

function getEmptyMetrics(): DashboardMetrics {
  return {
    requests: { total: 0, perSecond: 0, change: 0 },
    responseTime: { average: 0, p95: 0, p99: 0, change: 0 },
    statusCodes: {
      status2xx: 0,
      status3xx: 0,
      status4xx: 0,
      status5xx: 0,
      errorRate: 0,
    },
    topRoutes: [],
    backends: [],
    routers: [],
    geoLocations: [],
    userAgents: [],
    timeline: [],
    errors: [],
    logs: [], // <-- Ensure empty metrics also has the logs property
    topRequestAddresses: [], 
    topRequestHosts: [],     
    topClientIPs: [],       
  };
}