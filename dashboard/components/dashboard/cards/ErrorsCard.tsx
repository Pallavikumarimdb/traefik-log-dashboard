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
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">No errors detected</p>
          <p className="text-xs text-gray-500 mt-1">All systems operating normally</p>
        </div>
      </Card>
    );
  }

  const recentErrors = errors.slice(0, 10);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300 font-semibold';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 font-semibold';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 font-medium';
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
            className="flex items-start gap-3 p-3 rounded-lg border border-red-100 bg-white hover:bg-red-50/50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getLevelColor(error.level)}`}>
                {error.level}
              </span>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-mono leading-tight break-words text-gray-900">
                {error.message}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimestamp(error.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}