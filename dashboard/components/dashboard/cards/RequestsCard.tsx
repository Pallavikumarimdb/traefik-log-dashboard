'use client';

import { Activity } from 'lucide-react';
import Card from '@/components/ui/Card';
import { RequestMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface RequestsCardProps {
  metrics: RequestMetrics;
}

export default function RequestsCard({ metrics }: RequestsCardProps) {
  return (
    <Card
      title="Total Requests"
      icon={<Activity className="w-5 h-5 text-blue-600" />}
    >
      <div className="space-y-2">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatNumber(metrics.total)}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{metrics.perSecond.toFixed(2)} req/s</span>
        </div>
        {metrics.change !== 0 && (
          <div className={`text-sm ${metrics.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.change > 0 ? '↑' : '↓'} {Math.abs(metrics.change).toFixed(1)}%
          </div>
        )}
      </div>
    </Card>
  );
}