'use client';

import { useState, useEffect, useRef } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import { TraefikLog } from '@/lib/types';
import Header from '@/components/ui/Header';
import { parseTraefikLogs } from '@/lib/traefik-parser';
import { Activity } from 'lucide-react';

export default function DashboardPage() {
  const [logs, setLogs] = useState<TraefikLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [logCount, setLogCount] = useState(0);

  const positionRef = useRef<number>(-1);
  const isFirstFetch = useRef(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

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

        setLogCount(prev => prev + parsedLogs.length);
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

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Traefik Log Dashboard" connected={false} />
        <div className="flex items-center justify-center py-20">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">
              {error.includes('404')
                ? 'The agent is connected but no logs are available yet.'
                : 'Please check that the agent is running and accessible.'}
            </p>
            <button
              onClick={() => {
                isFirstFetch.current = true;
                positionRef.current = -1;
                fetchLogs();
              }}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Traefik Log Dashboard" connected={connected} />
      
      {/* Status bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing <span className="font-semibold text-gray-900">{logs.length}</span> logs
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            )}
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
              Auto-refreshing every 3s
            </span>
          </div>
        </div>
      </div>

      <Dashboard logs={logs} demoMode={false} />
    </div>
  );
}

function Header({ title, connected }: { title: string; connected: boolean }) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-gray-900" />
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}