'use client';

import { memo, useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { RouterMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface Props {
  routers: RouterMetrics[];
}

function RoutersCard({ routers }: Props) {
  // Memoize expensive calculations - hooks before early returns
  const { maxRequests, topRouters } = useMemo(() => {
    if (!routers || routers.length === 0) {
      return { maxRequests: 1, topRouters: [] };
    }
    return {
      maxRequests: Math.max(...routers.map(r => r.requests), 1),
      topRouters: routers.slice(0, 10),
    };
  }, [routers]);

  if (!routers || routers.length === 0) {
    return (
      <Card title="Routers" icon={<GitBranch className="w-5 h-5 text-primary" />}>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No router data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Routers" icon={<GitBranch className="w-5 h-5 text-primary" />}>
      <div className="space-y-4">
        {topRouters.map((router, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary/10 rounded text-primary">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium truncate" title={router.name}>
                    {router.name}
                  </span>
                </div>
                {router.service && (
                  <div className="ml-8 mt-1">
                    <span className="text-xs text-muted-foreground">→ {router.service}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap">
                <span className="font-medium">{formatNumber(router.requests)}</span>
                <span className="opacity-50">•</span>
                <span>{router.avgDuration.toFixed(0)}ms</span>
              </div>
            </div>
            <div className="ml-8">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${(router.requests / maxRequests) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default memo(RoutersCard);