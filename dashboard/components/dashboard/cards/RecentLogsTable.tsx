'use client';

import { useState } from 'react';
import { List, ChevronDown } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { TraefikLog } from '@/lib/types';
import { formatDuration, getStatusColor, formatBytes, timeAgo } from '@/lib/utils';

interface Props {
	logs: TraefikLog[];
}

// Define all possible columns for the table, matching your list
const allColumns = [
    { id: 'StartUTC', header: 'Time', defaultVisible: true },
    { id: 'ClientHost', header: 'Client IP', defaultVisible: true },
    { id: 'RequestMethod', header: 'Method', defaultVisible: true },
    { id: 'RequestPath', header: 'Path', defaultVisible: true },
    { id: 'DownstreamStatus', header: 'Status', defaultVisible: true },
    { id: 'Duration', header: 'Response Time', defaultVisible: true },
    { id: 'ServiceName', header: 'Service', defaultVisible: true },
    { id: 'RouterName', header: 'Router', defaultVisible: true },
    { id: 'RequestHost', header: 'Host', defaultVisible: false },
    { id: 'request_User_Agent', header: 'User Agent', defaultVisible: false },
    { id: 'DownstreamContentSize', header: 'Size', defaultVisible: false },
    { id: 'RequestAddr', header: 'Request Addr', defaultVisible: false },
    { id: 'ClientPort', header: 'Client Port', defaultVisible: false },
    { id: 'RequestProtocol', header: 'Protocol', defaultVisible: false },
    { id: 'RequestScheme', header: 'Scheme', defaultVisible: false },
    { id: 'OriginDuration', header: 'Origin Duration', defaultVisible: false },
    { id: 'Overhead', header: 'Overhead', defaultVisible: false },
    { id: 'RetryAttempts', header: 'Retries', defaultVisible: false },
];

export default function RecentLogsTable({ logs }: Props) {
  // Set initial visibility based on the 'defaultVisible' property
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => 
    Object.fromEntries(allColumns.map(c => [c.id, c.defaultVisible]))
  );

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleColumnDefs = allColumns.filter(c => visibleColumns[c.id]);

  // Helper function to render cell content based on column ID
  const renderCell = (log: TraefikLog, columnId: string) => {
    const value = log[columnId as keyof TraefikLog];

    switch (columnId) {
      case 'StartUTC':
        return new Date(log.StartUTC || log.StartLocal).toLocaleString();
      case 'DownstreamStatus':
        return <span className={getStatusColor(log.DownstreamStatus)}>{log.DownstreamStatus}</span>;
      case 'Duration':
      case 'OriginDuration':
      case 'Overhead':
        return formatDuration(value as number);
      case 'DownstreamContentSize':
      case 'RequestContentSize':
        return formatBytes(value as number);
      default:
        return String(value || 'N/A');
    }
  };

  return (
    <Card 
      title="Recent Logs" 
      icon={
        <div className="relative group">
          <details className="relative">
            <summary className="flex items-center gap-1 cursor-pointer text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
              <span>Columns</span>
              <ChevronDown className="w-4 h-4" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-black border dark:border-gray-700 rounded-md shadow-lg z-10 p-2 space-y-1 max-h-80 overflow-y-auto">
              {allColumns.map(col => (
                <label key={col.id} className="flex items-center gap-2 text-sm w-full hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!visibleColumns[col.id]}
                    onChange={() => toggleColumn(col.id)}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black dark:bg-gray-700 dark:border-gray-600"
                  />
                  {col.header}
                </label>
              ))}
            </div>
          </details>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900">
            <tr className="border-b dark:border-gray-700">
              {visibleColumnDefs.map(col => (
                <th key={col.id} className="py-2 px-3 text-left font-semibold">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.slice(0, 100).map((log, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                {visibleColumnDefs.map(col => (
                  <td key={col.id} className="py-2 px-3 whitespace-nowrap" title={String(log[col.id as keyof TraefikLog] || '')}>
                    <div className="truncate max-w-xs">
                      {renderCell(log, col.id)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}