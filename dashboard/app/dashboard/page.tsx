'use client';

import { useEffect, useState, useRef } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import Header from '@/components/ui/Header';
import { apiClient } from '@/lib/api-client';
import { parseTraefikLogs } from '@/lib/traefik-parser';
import { TraefikLog } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [logs, setLogs] = useState<TraefikLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [logCount, setLogCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionRef = useRef<number>(-1); // Start with -1 for tail mode
  const isFirstFetch = useRef(true);
  const allLogsRef = useRef<TraefikLog[]>([]); // Store all logs

  const fetchLogs = async () => {
    try {
      // Check agent status first
      const status = await apiClient.getStatus();
      
      if (!status.access_path_exists) {
        setError('Access log file not found. Please check agent configuration.');
        setLoading(false);
        setConnected(false);
        return;
      }

      setConnected(true);

      // Fetch access logs with position tracking
      // On first fetch, use tail=true to get last 1000 lines
      // On subsequent fetches, use the stored position
      const params = new URLSearchParams({
        lines: '1000',
      });
      
      if (isFirstFetch.current) {
        params.append('tail', 'true');
        params.append('position', '-1');
        isFirstFetch.current = false;
      } else if (positionRef.current >= 0) {
        params.append('position', positionRef.current.toString());
      } else {
        // Default to getting new logs from tracked position
        params.append('position', '-2');
      }

      const url = `/api/logs/access?${params}`;
      console.log('Fetching logs from:', url);

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }

      const data = await response.json();
      
      // Debug: Log raw response
      console.log('Fetched logs count:', data.logs?.length || 0);
      console.log('New position:', data.positions?.[0]?.position);

      // Update position for next fetch
      if (data.positions && data.positions.length > 0) {
        positionRef.current = data.positions[0].position;
      }

      // Parse the logs
      const newParsedLogs = parseTraefikLogs(data.logs || []);
      
      console.log('Newly parsed logs count:', newParsedLogs.length);

      if (newParsedLogs.length > 0) {
        // Add new logs to our collection
        const combinedLogs = [...allLogsRef.current, ...newParsedLogs];
        
        // Remove duplicates based on a unique combination of fields
        const uniqueLogs = new Map<string, TraefikLog>();
        combinedLogs.forEach(log => {
          const key = `${log.StartUTC}-${log.ClientAddr}-${log.RequestPath}-${log.Duration}`;
          uniqueLogs.set(key, log);
        });

        const dedupedLogs = Array.from(uniqueLogs.values());

        // Sort by timestamp (newest first)
        const sortedLogs = dedupedLogs.sort((a, b) => {
          const timeA = new Date(a.StartUTC || a.StartLocal || 0).getTime();
          const timeB = new Date(b.StartUTC || b.StartLocal || 0).getTime();
          return timeB - timeA;
        });

        // Keep only last 5000 logs to prevent memory issues
        const trimmedLogs = sortedLogs.slice(0, 5000);

        allLogsRef.current = trimmedLogs;
        setLogs(trimmedLogs);
        setLogCount(trimmedLogs.length);
        setLastUpdate(new Date());
        setError(null);

        console.log('Total unique logs:', trimmedLogs.length);
      } else if (logs.length === 0) {
        // Only set error if we don't have any logs yet
        setError('No logs found. Waiting for Traefik to generate access logs...');
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to connect to agent. Please ensure the agent is running.'
      );
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLogs();

    // Set up polling interval (3 seconds for more responsive updates)
    intervalRef.current = setInterval(fetchLogs, 3000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="TRAEFIK LOG DASHBOARD" connected={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="TRAEFIK LOG DASHBOARD" connected={connected} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connection Issue</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <p className="text-sm text-muted-foreground">
                {connected 
                  ? 'The agent is connected but no logs are available yet.'
                  : 'Please check that the agent is running and accessible.'}
              </p>
              <Button
                onClick={() => {
                  isFirstFetch.current = true;
                  positionRef.current = -1;
                  fetchLogs();
                }}
                variant="default"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="TRAEFIK LOG DASHBOARD" connected={connected} />
      {/* Status bar */}
      <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {logCount} logs
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            )}
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Auto-refreshing every 3s
            </span>
          </div>
        </div>
      </div>
      <Dashboard logs={logs} demoMode={false} />
    </div>
  );
}