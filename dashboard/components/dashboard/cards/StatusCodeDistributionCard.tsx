'use client';

import { memo, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { StatusCodeMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface Props {
  metrics: StatusCodeMetrics;
}

function StatusCodeDistributionCard({ metrics }: Props) {
  // Memoize calculations - hooks before early returns
  const { total, codes } = useMemo(() => {
    const t = metrics.status2xx + metrics.status3xx + metrics.status4xx + metrics.status5xx;
    if (t === 0) {
      return { total: 0, codes: [] };
    }
    return {
      total: t,
      codes: [
        {
          label: '2xx Success',
          count: metrics.status2xx,
          percentage: (metrics.status2xx / t) * 100,
          color: 'bg-green-500 dark:bg-green-600',
          textColor: 'text-green-700 dark:text-green-400'
        },
        {
          label: '3xx Redirect',
          count: metrics.status3xx,
          percentage: (metrics.status3xx / t) * 100,
          color: 'bg-blue-500 dark:bg-blue-600',
          textColor: 'text-blue-700 dark:text-blue-400'
        },
        {
          label: '4xx Client Error',
          count: metrics.status4xx,
          percentage: (metrics.status4xx / t) * 100,
          color: 'bg-yellow-500 dark:bg-yellow-600',
          textColor: 'text-yellow-700 dark:text-yellow-400'
        },
        {
          label: '5xx Server Error',
          count: metrics.status5xx,
          percentage: (metrics.status5xx / t) * 100,
          color: 'bg-destructive',
          textColor: 'text-destructive'
        }
      ],
    };
  }, [metrics]);

  if (total === 0) {
    return (
      <Card title="Status Code Distribution" icon={<BarChart3 className="w-5 h-5 text-primary" />}>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No status code data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Status Code Distribution" icon={<BarChart3 className="w-5 h-5 text-primary" />}>
      <div className="space-y-4">
        {codes.map((code, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{code.label}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium">{formatNumber(code.count)}</span>
                <span className="opacity-50">•</span>
                <span className={`font-semibold ${code.textColor}`}>{code.percentage.toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${code.color} transition-all duration-500 ease-out`}
                style={{ width: `${code.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default memo(StatusCodeDistributionCard);