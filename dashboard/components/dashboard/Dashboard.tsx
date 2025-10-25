'use client';

import { useMemo, useState, useEffect } from 'react';
import DashboardGrid from './DashboardGrid';
import { TraefikLog, DashboardMetrics, AddressMetric, HostMetric, ClientMetric, GeoLocation } from '@/lib/types';
import {
  calculateAverage,
  calculatePercentile,
  groupBy,
  parseUserAgent,
  extractUserAgentIdentifier,
} from '@/lib/utils';
import { aggregateGeoLocations } from '@/lib/location';

interface DashboardProps {
  logs: TraefikLog[];
  demoMode?: boolean;
}

export default function Dashboard({ logs, demoMode = false }: DashboardProps) {
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);

  // Debounce logs to prevent excessive API calls
  const [debouncedLogs, setDebouncedLogs] = useState(logs);

  useEffect(() => {
    // Debounce log updates - wait 2 seconds after last update
    const timer = setTimeout(() => {
      setDebouncedLogs(logs);
    }, 2000);

    return () => clearTimeout(timer);
  }, [logs]);

  // Calculate metrics (excluding geo data which is async)
  const metrics = useMemo(() => {
    if (logs.length === 0) {
      return getEmptyMetrics();
    }

    // Sort logs by most recent first and keep latest 1000 entries
    const sortedLogs = [...logs]
      .sort((a, b) => {
        const timeA = new Date(a.StartUTC || a.StartLocal).getTime();
        const timeB = new Date(b.StartUTC || b.StartLocal).getTime();
        return timeB - timeA; // Most recent first
      })
      .slice(0, 1000);

    return calculateMetrics(sortedLogs, geoLocations);
  }, [logs, geoLocations]);

  // Fetch GeoIP data from agent (simplified - no rate limiting needed)
  useEffect(() => {
    let isMounted = true;

    async function fetchGeoData() {
      if (debouncedLogs.length === 0) {
        setGeoLocations([]);
        return;
      }

      setIsLoadingGeo(true);
      
      try {
        // Take latest 1000 logs for GeoIP lookup
        const sortedLogs = [...debouncedLogs]
          .sort((a, b) => {
            const timeA = new Date(a.StartUTC || a.StartLocal).getTime();
            const timeB = new Date(b.StartUTC || b.StartLocal).getTime();
            return timeB - timeA;
          })
          .slice(0, 1000);

        console.log('Starting GeoIP lookup for', sortedLogs.length, 'logs');
        
        // Agent handles all batching and rate limiting
        const locations = await aggregateGeoLocations(sortedLogs);
        
        if (isMounted) {
          setGeoLocations(locations);
          setIsLoadingGeo(false);
          console.log('GeoIP lookup complete:', locations.length, 'countries found');
        }
      } catch (error) {
        console.error('Failed to fetch GeoIP data:', error);
        if (isMounted) {
          setGeoLocations([]);
          setIsLoadingGeo(false);
        }
      }
    }

    fetchGeoData();

    return () => {
      isMounted = false;
    };
  }, [debouncedLogs]);

  // Fetch system stats
  useEffect(() => {
    let isMounted = true;

    async function fetchSystemStats() {
      if (demoMode) return; // Skip in demo mode

      try {
        const response = await fetch('/api/system/resources');
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setSystemStats(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    }

    fetchSystemStats();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchSystemStats, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [demoMode]);

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

function calculateMetrics(logs: TraefikLog[], geoLocations: GeoLocation[]): DashboardMetrics {
  // Request metrics
  const total = logs.length;
  const timeSpan = calculateTimeSpan(logs);
  const perSecond = timeSpan > 0 ? total / timeSpan : 0;

  // Response time metrics
  const durations = logs.map(l => l.Duration / 1000000); // Convert to milliseconds
  const avgDuration = calculateAverage(durations);
  const p95Duration = calculatePercentile(durations, 95);
  const p99Duration = calculatePercentile(durations, 99);

  // Status code metrics
  const statusCodes = logs.map(l => l.DownstreamStatus);
  const status2xx = statusCodes.filter(s => s >= 200 && s < 300).length;
  const status3xx = statusCodes.filter(s => s >= 300 && s < 400).length;
  const status4xx = statusCodes.filter(s => s >= 400 && s < 500).length;
  const status5xx = statusCodes.filter(s => s >= 500).length;
  const errorRate = total > 0 ? ((status4xx + status5xx) / total) * 100 : 0;

  // Top routes
  const routeGroups = groupBy(logs.filter(l => l.RequestPath), 'RequestPath');
  const topRoutes = Object.entries(routeGroups)
    .map(([path, routeLogs]) => ({
      path,
      count: routeLogs.length,
      avgDuration: calculateAverage(routeLogs.map(l => l.Duration / 1000000)),
      method: routeLogs[0]?.RequestMethod || 'GET',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Backend services
  const backendGroups = groupBy(logs.filter(l => l.ServiceName), 'ServiceName');
  const backends = Object.entries(backendGroups)
    .map(([name, backendLogs]) => {
      const errors = backendLogs.filter(l => l.DownstreamStatus >= 400).length;
      return {
        name,
        requests: backendLogs.length,
        avgDuration: calculateAverage(backendLogs.map(l => l.Duration / 1000000)),
        errorRate: backendLogs.length > 0 ?
          (errors / backendLogs.length) * 100 : 0,
        url: backendLogs[0]?.ServiceURL || '',
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

  // User agents - Extract identifier, group, show top 11 + Others
  const userAgentIdentifierGroups: Record<string, string[]> = {};

  // First pass: Extract identifiers and group the original user agents
  logs.filter(l => l.request_User_Agent).forEach(log => {
    const identifier = extractUserAgentIdentifier(log.request_User_Agent || '');
    if (!userAgentIdentifierGroups[identifier]) {
      userAgentIdentifierGroups[identifier] = [];
    }
    userAgentIdentifierGroups[identifier].push(log.request_User_Agent || '');
  });

  // Convert to array and sort by count
  const sortedUserAgents = Object.entries(userAgentIdentifierGroups)
    .map(([identifier, agents]) => ({
      identifier,
      count: agents.length,
      percentage: (agents.length / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Take top 11, aggregate the rest as "Others"
  const top11 = sortedUserAgents.slice(0, 11);
  const othersCount = sortedUserAgents.slice(11).reduce((sum, ua) => sum + ua.count, 0);

  // Build final userAgents array
  const userAgents = top11.map(ua => ({
    browser: ua.identifier,
    count: ua.count,
    percentage: ua.percentage,
  }));

  // Add "Others" if there are more than 11 unique identifiers
  if (sortedUserAgents.length > 11) {
    userAgents.push({
      browser: 'Others',
      count: othersCount,
      percentage: (othersCount / total) * 100,
    });
  }

  // Timeline - keep latest data points
  const timeline = generateTimeline(logs);

  // Recent errors - keep latest 50 errors
  const errors = logs
    .filter(l => l.DownstreamStatus >= 400)
    .slice(0, 50)
    .map(l => ({
      timestamp: l.StartUTC || l.StartLocal,
      level: l.DownstreamStatus >= 500 ? 'error' : 'warning',
      message: `${l.RequestMethod} ${l.RequestPath} - ${l.DownstreamStatus}`,
      status: l.DownstreamStatus,
    }));

  return {
    requests: {
      total,
      perSecond,
      change: 0,
    },
    responseTime: {
      average: avgDuration,
      p95: p95Duration,
      p99: p99Duration,
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
    topRequestAddresses,
    topRequestHosts,
    topClientIPs,
    userAgents,
    timeline,
    errors,
    geoLocations,
    logs, // Pass sorted logs to table
  };
}

function calculateTimeSpan(logs: TraefikLog[]): number {
  if (logs.length < 2) return 0;

  const timestamps = logs
    .map(l => new Date(l.StartUTC || l.StartLocal).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);

  if (timestamps.length < 2) return 0;

  const span = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
  return span;
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
    statusCodes: { status2xx: 0, status3xx: 0, status4xx: 0, status5xx: 0, errorRate: 0 },
    topRoutes: [],
    backends: [],
    routers: [],
    topRequestAddresses: [],
    topRequestHosts: [],
    topClientIPs: [],
    userAgents: [],
    timeline: [],
    errors: [],
    geoLocations: [],
    logs: [], // Include empty logs array
  };
}