'use client';

import { memo, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { RouteMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface Props {
  routes: RouteMetrics[];
}

function TopRoutesCard({ routes }: Props) {
  // Memoize expensive calculations - hooks must be called before early returns
  const { maxCount, topRoutes } = useMemo(() => {
    if (!routes || routes.length === 0) {
      return { maxCount: 1, topRoutes: [] };
    }
    return {
      maxCount: Math.max(...routes.map(r => r.count), 1),
      topRoutes: routes.slice(0, 10),
    };
  }, [routes]);

  // Early return after hooks
  if (!routes || routes.length === 0) {
    return (
      <Card title="Top Routes" icon={<TrendingUp className="w-5 h-5 text-primary" />}>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No route data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Top Routes" icon={<TrendingUp className="w-5 h-5 text-primary" />}>
      <div className="space-y-4">
        {topRoutes.map((route, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary/10 rounded text-primary">
                    {idx + 1}
                  </span>
                  <span className="font-mono text-xs font-medium truncate" title={route.path}>
                    {route.path}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap">
                <span className="font-medium">{formatNumber(route.count)}</span>
                <span className="opacity-50">•</span>
                <span>{route.avgDuration.toFixed(0)}ms</span>
              </div>
            </div>
            <div className="ml-8">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${(route.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default memo(TopRoutesCard);