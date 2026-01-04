'use client';

import { memo, useMemo, useCallback } from 'react';
import { Server, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { BackendMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface Props {
  backends: BackendMetrics[];
}

function BackendsCard({ backends }: Props) {
  // Memoize expensive calculations - single pass through backends array
  // Hooks must be called before any early returns
  const { totalRequests, healthyBackends, warningBackends, criticalBackends } = useMemo(() => {
    if (!backends || backends.length === 0) {
      return { totalRequests: 0, healthyBackends: 0, warningBackends: 0, criticalBackends: 0 };
    }
    let total = 0, healthy = 0, warning = 0, critical = 0;
    for (const b of backends) {
      total += b.requests;
      if (b.errorRate < 5) healthy++;
      else if (b.errorRate < 10) warning++;
      else critical++;
    }
    return { totalRequests: total, healthyBackends: healthy, warningBackends: warning, criticalBackends: critical };
  }, [backends]);

  // Memoize status calculation function - must be before early returns
  const getHealthStatus = useCallback((errorRate: number) => {
    if (errorRate < 5) return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', label: 'Healthy' };
    if (errorRate < 10) return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-200 dark:border-yellow-800', label: 'Warning' };
    return { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', label: 'Critical' };
  }, []);

  // Early return after hooks
  if (!backends || backends.length === 0) {
    return (
      <Card title="Backends" icon={<Server className="w-5 h-5 text-primary" />}>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No backend data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Backends" icon={<Server className="w-5 h-5 text-primary" />}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-200 dark:border-green-800 text-center">
            <div className="text-2xl font-bold text-green-600">{healthyBackends}</div>
            <div className="text-xs text-muted-foreground mt-1">Healthy</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800 text-center">
            <div className="text-2xl font-bold text-yellow-600">{warningBackends}</div>
            <div className="text-xs text-muted-foreground mt-1">Warning</div>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20 text-center">
            <div className="text-2xl font-bold text-destructive">{criticalBackends}</div>
            <div className="text-xs text-muted-foreground mt-1">Critical</div>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {backends.map((backend, idx) => {
            const status = getHealthStatus(backend.errorRate);
            const StatusIcon = status.icon;
            const percentage = (backend.requests / totalRequests) * 100;

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${status.border} ${status.bg} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <StatusIcon className={`w-5 h-5 ${status.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate text-foreground" title={backend.name}>
                        {backend.name}
                      </div>
                      {backend.url && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5" title={backend.url}>
                          {backend.url}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`text-xs font-semibold px-2 py-1 rounded ${status.bg} ${status.color} whitespace-nowrap`}>
                    {status.label}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <div className="text-xs text-foreground/70 dark:text-muted-foreground">Requests</div>
                    <div className="text-sm font-bold text-foreground">{formatNumber(backend.requests)}</div>
                    <div className="text-xs text-foreground/60 dark:text-muted-foreground">{percentage.toFixed(1)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-foreground/70 dark:text-muted-foreground">Avg Time</div>
                    <div className="text-sm font-bold text-foreground">{backend.avgDuration.toFixed(0)}ms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-foreground/70 dark:text-muted-foreground">Error Rate</div>
                    <div className={`text-sm font-bold ${status.color}`}>{backend.errorRate.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Total Backend Traffic
            </span>
            <span className="font-bold">{formatNumber(totalRequests)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default memo(BackendsCard);