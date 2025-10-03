'use client';

import { useMemo } from 'react';
import DashboardGrid from './DashboardGrid';
import { TraefikLog, DashboardMetrics } from '@/lib/types';
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

  // Response time metrics
  const durations = logs.map(log => log.Duration / 1000000); // Convert to ms
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

  // Backends (services)
  const serviceGroups = groupBy(logs.filter(l => l.ServiceName), 'ServiceName');
  const backends = Object.entries(serviceGroups)
    .map(([name, serviceLogs]) => {
      const errors = serviceLogs.filter(l => l.DownstreamStatus >= 400).length;
      return {
        name,
        requests: serviceLogs.length,
        avgDuration: calculateAverage(serviceLogs.map(l => l.Duration / 1000000)),
        errorRate: serviceLogs.length > 0 ? (errors / serviceLogs.length) * 100 : 0,
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
      service: routerLogs[0].ServiceName || 'N/A',
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
      const { browser } = parseUserAgent(ua);
      return { browser, count: uaLogs.length };
    })
    .reduce((acc, { browser, count }) => {
      const existing = acc.find(item => item.browser === browser);
      if (existing) {
        existing.count += count;
      } else {
        acc.push({ browser, count, percentage: 0 });
      }
      return acc;
    }, [] as { browser: string; count: number; percentage: number }[])
    .map(item => ({
      ...item,
      percentage: (item.count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Timeline
  const timeline = calculateTimeline(logs);

  // Recent errors (from error logs would be better, but using 5xx from access logs)
  const errors = logs
    .filter(log => log.DownstreamStatus >= 500)
    .slice(0, 10)
    .map(log => ({
      timestamp: log.StartUTC,
      level: 'error',
      message: `${log.RequestMethod} ${log.RequestPath} - ${log.DownstreamStatus}`,
    }));

  return {
    requests: {
      total,
      perSecond,
      change: 0, // Would need historical data
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
  };
}

function calculateTimeSpan(logs: TraefikLog[]): number {
  if (logs.length < 2) return 0;

  const timestamps = logs
    .map(log => new Date(log.StartUTC).getTime())
    .sort((a, b) => a - b);

  const earliest = timestamps[0];
  const latest = timestamps[timestamps.length - 1];

  return (latest - earliest) / 1000; // Convert to seconds
}

function calculateTimeline(logs: TraefikLog[]): Array<{ timestamp: string; value: number }> {
  if (logs.length === 0) return [];

  // Group logs by minute
  const minuteGroups: Record<string, number> = {};

  logs.forEach(log => {
    const date = new Date(log.StartUTC);
    const minute = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
    const key = minute.toISOString();
    minuteGroups[key] = (minuteGroups[key] || 0) + 1;
  });

  return Object.entries(minuteGroups)
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-60); // Last 60 minutes
}

function getEmptyMetrics(): DashboardMetrics {
  return {
    requests: { total: 0, perSecond: 0, change: 0 },
    responseTime: { average: 0, p95: 0, p99: 0, change: 0 },
    statusCodes: { status2xx: 0, status3xx: 0, status4xx: 0, status5xx: 0, errorRate: 0 },
    topRoutes: [],
    backends: [],
    routers: [],
    geoLocations: [],
    userAgents: [],
    timeline: [],
    errors: [],
  };
}