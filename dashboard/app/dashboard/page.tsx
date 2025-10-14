// dashboard/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardWithFilters from '@/components/dashboard/DashboardWithFilters'; 
import Header from '@/components/ui/Header';
import { TraefikLog } from '@/lib/types';
import { parseTraefikLogs } from '@/lib/traefik-parser';

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
        const position = positionRef.current ?? -1;
        
        const response = await fetch(
          `/api/logs/access?period=1h&position=${position}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.logs && data.logs.length > 0) {
          const parsedLogs = parseTraefikLogs(data.logs);

          setLogs((prevLogs: TraefikLog[]) => {
            if (isFirstFetch.current) {
              isFirstFetch.current = false;
              return parsedLogs;
            }
            return [...prevLogs, ...parsedLogs].slice(-1000);
          });
        }

        if (data.positions && data.positions.length > 0 && typeof data.positions[0].Position === 'number') {
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
    const interval = setInterval(fetchLogs, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <Header
          title="TRAEFIK LOG DASHBOARD"
          connected={false}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Connecting to agent...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <Header
          title="TRAEFIK LOG DASHBOARD"
          connected={false}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connection Error
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Make sure the agent is running and accessible
              </p>
            </div>
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
        lastUpdate={lastUpdate}
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

      <DashboardWithFilters logs={logs} demoMode={false} /> 
    </div>
  );
}