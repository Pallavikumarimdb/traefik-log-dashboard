'use client';

import { TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import { RouteMetrics } from '@/lib/types';
import { formatNumber, truncate } from '@/lib/utils';

interface TopRoutesCardProps {
  routes: RouteMetrics[];
}

export default function TopRoutesCard({ routes }: TopRoutesCardProps) {
  if (routes.length === 0) {
    return (
      <Card title="Top Routes" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
        <div className="text-center py-8 text-muted-foreground">
          No route data available
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...routes.map(r => r.count));

  return (
    <Card title="Top Routes" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
      <div className="space-y-3">
        {routes.map((route, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-mono text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {route.method}
                </span>
                <span className="truncate font-medium" title={route.path}>
                  {truncate(route.path, 30)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatNumber(route.count)}</span>
                <span>{route.avgDuration.toFixed(0)}ms</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(route.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}