'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import Header from '@/components/ui/Header';
import { apiClient } from '@/lib/api-client';
import { parseTraefikLogs } from '@/lib/traefik-parser';
import { TraefikLog } from '@/lib/types';
import { AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [logs, setLogs] = useState<TraefikLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Check agent status first
        const status = await apiClient.getStatus();
        
        if (!status.access_path_exists) {
          setError('Access log file not found. Please check agent configuration.');
          setLoading(false);
          return;
        }

        setConnected(true);

        // Fetch access logs
        const response = await apiClient.getAccessLogs(0, 1000);
        const parsedLogs = parseTraefikLogs(response.logs);
        setLogs(parsedLogs);
        setError(null);
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

    fetchLogs();

    // Refresh logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000);

    return () => clearInterval(interval);
  }, []);

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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="TRAEFIK LOG DASHBOARD" connected={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <p className="text-sm text-muted-foreground">
                Please check that the agent is running and accessible.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="TRAEFIK LOG DASHBOARD" connected={connected} />
      <Dashboard logs={logs} demoMode={false} />
    </div>
  );
}