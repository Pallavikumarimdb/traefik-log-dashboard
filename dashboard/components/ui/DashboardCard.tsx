'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * DashboardCard - A convenience wrapper around Shadcn Card primitives.
 * Provides a consistent dashboard card layout with title and optional icon.
 *
 * @deprecated Consider using Card, CardHeader, CardTitle, CardContent directly
 * for more flexibility and consistency with Shadcn patterns.
 */
export default function DashboardCard({ title, icon, children, className = '' }: DashboardCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">{title}</CardTitle>
        {icon && <div className="text-primary">{icon}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}