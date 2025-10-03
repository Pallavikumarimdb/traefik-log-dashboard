'use client';

import { AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import { ErrorLog } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

interface ErrorsCardProps {
  errors: ErrorLog[];
}

export default function ErrorsCard({ errors }: ErrorsCardProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Card title="Recent Errors" icon={<AlertTriangle className="w-5 h-5 text-red-600" />}>
      <div className="space-y-2">
        {errors.map((error, index) => (
          <div
            key={index}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-red-900 dark:text-red-100 truncate">
                  {error.message}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {timeAgo(new Date(error.timestamp))}
                </div>
              </div>
              <div className="text-xs font-semibold px-2 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded">
                {error.level.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}