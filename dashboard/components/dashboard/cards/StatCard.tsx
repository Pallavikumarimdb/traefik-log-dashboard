'use client';

import { ReactNode, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  className?: string;
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend = 'neutral',
  change,
  className,
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change !== undefined && (
            <span className={cn('text-xs font-medium', getTrendColor())}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(StatCard);