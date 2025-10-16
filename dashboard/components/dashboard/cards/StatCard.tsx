'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend = 'neutral',
  change,
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500';
  };

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-red-300 transition-all">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
            {change !== undefined && (
              <span className={`text-xs font-medium ${getTrendColor()}`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 rounded-lg bg-red-50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}