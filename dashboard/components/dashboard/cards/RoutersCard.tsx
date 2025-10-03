'use client';

import { GitBranch } from 'lucide-react';
import Card from '@/components/ui/Card';
import { RouterMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface RoutersCardProps {
  routers: RouterMetrics[];
}

export default function RoutersCard({ routers }: RoutersCardProps) {
  if (routers.length === 0) {
    return (
      <Card title="Routers" icon={<GitBranch className="w-5 h-5 text-purple-600" />}>
        <div className="text-center py-8 text-muted-foreground">
          No router data available
        </div>
      </Card>
    );
  }

  const maxRequests = Math.max(...routers.map(r => r.requests));

  return (
    <Card title="Routers" icon={<GitBranch className="w-5 h-5 text-purple-600" />}>
      <div className="space-y-3">
        {routers.map((router, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{router.name}</div>
                <div className="text-xs text-muted-foreground truncate">→ {router.service}</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground ml-2">
                <span>{formatNumber(router.requests)}</span>
                <span>{router.avgDuration.toFixed(0)}ms</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${(router.requests / maxRequests) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}