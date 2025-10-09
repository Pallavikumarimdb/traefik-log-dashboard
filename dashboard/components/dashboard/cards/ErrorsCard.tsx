'use client';

import { AlertCircle } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { ErrorLog } from '@/lib/types';

interface Props {
  errors: ErrorLog[];
}

export default function ErrorsCard({ errors }: Props) {
  if (!errors || errors.length === 0) {
    return (
      <Card title="Recent Errors" icon={<AlertCircle className="w-5 h-5 text-red-600" />}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No errors detected</p>
          <p className="text-xs text-muted-foreground/60 mt-1">All systems operating normally</p>
        </div>
      </Card>
    );
  }

  const recentErrors = errors.slice(0, 10);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800 font-semibold';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800 font-semibold';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 font-medium';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card title="Recent Errors" icon={<AlertCircle className="w-5 h-5 text-red-600" />}>
      <div className="space-y-3">
        {recentErrors.map((error, idx) => (
          <div 
            key={idx}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getLevelColor(error.level)}`}>
                {error.level}
              </span>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-mono leading-tight break-words">
                {error.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(error.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}