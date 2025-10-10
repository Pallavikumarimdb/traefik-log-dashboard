'use client';

import { useEffect, useState, useRef } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import Header from '@/components/ui/Header';
import { TraefikLog } from '@/lib/types';
import { parseTraefikLogs } from '@/lib/traefik-parser';
import { Activity } from 'lucide-react';

export default function DashboardPage() {
  const [logs, setLogs] = useState<TraefikLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const positionRef = useRef<number>(-1);
  const isFirstFetch = useRef(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(
          `/api/logs/access?period=1h&position=${positionRef.current}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.logs && data.logs.length > 0) {
          const parsedLogs = parseTraefikLogs(data.logs);

          setLogs(prevLogs => {
            if (isFirstFetch.current) {
              isFirstFetch.current = false;
              return parsedLogs;
            }
            return [...prevLogs, ...parsedLogs].slice(-1000);
          });
        }

        if (data.positions && data.positions.length > 0) {
          positionRef.current = data.positions[0].Position;
        }

        setConnected(true);
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <Header title="TRAEFIK LOG DASHBOARD" connected={false} demoMode={false} />
        <div className="flex items-center justify-center py-20">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">
              {error.includes('404')
                ? 'The agent is connected but no logs are available yet.'
                : 'Please check that the agent is running and accessible.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <Header
        title="TRAEFIK LOG DASHBOARD"
        connected={connected}
        demoMode={false}
        lastUpdate={lastUpdate || undefined}
      />
      
      <div className="bg-white border-b border-red-200 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing <span className="font-semibold text-red-600">{logs.length}</span> logs
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            )}
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              Auto-refreshing every 3s
            </span>
          </div>
        </div>
      </div>

      <Dashboard logs={logs} demoMode={false} />
    </div>
  );
}