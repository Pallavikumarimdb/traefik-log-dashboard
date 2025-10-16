'use client';

import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { RequestMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface Props {
  metrics: RequestMetrics;
}

export default function RequestsCard({ metrics }: Props) {
  const getTrendIcon = () => {
    if (metrics.change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (metrics.change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getTrendColor = () => {
    if (metrics.change > 0) return 'text-green-600';
    if (metrics.change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const sparklineData = Array.from({ length: 20 }, (_, i) => {
    const variance = Math.random() * 0.3 - 0.15;
    return metrics.perSecond * (1 + variance);
  });

  const maxValue = Math.max(...sparklineData);
  const minValue = Math.min(...sparklineData);

  return (
    <Card title="Requests" icon={<Activity className="w-5 h-5 text-red-600" />}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {formatNumber(metrics.total)}
          </div>
          <div className="text-sm text-gray-600">Total Requests</div>
          {metrics.change !== undefined && metrics.change !== 0 && (
            <div className={`flex items-center justify-center gap-1 mt-2 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-semibold">
                {Math.abs(metrics.change).toFixed(1)}% {metrics.change > 0 ? 'increase' : 'decrease'}
              </span>
            </div>
          )}
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Requests per Second</span>
            <span className="text-2xl font-bold text-red-600">{metrics.perSecond.toFixed(2)}</span>
          </div>
          <div className="h-12 flex items-end gap-0.5 mt-3">
            {sparklineData.map((value, idx) => {
              const height = ((value - minValue) / (maxValue - minValue)) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-red-500 rounded-t transition-all hover:bg-red-600"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                  title={`${value.toFixed(2)} req/s`}
                />
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="text-xs text-gray-600 mb-1">Per Minute</div>
            <div className="text-xl font-bold text-red-600">
              {formatNumber(Math.round(metrics.perSecond * 60))}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="text-xs text-gray-600 mb-1">Per Hour</div>
            <div className="text-xl font-bold text-red-600">
              {formatNumber(Math.round(metrics.perSecond * 3600))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}