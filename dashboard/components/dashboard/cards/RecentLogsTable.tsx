'use client';

import { useState, useMemo } from 'react';
import { List, ChevronDown } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { TraefikLog } from '@/lib/types';

interface Props {
  logs: TraefikLog[];
}

// Define all possible columns matching old design
const allColumns = [
  { id: 'StartUTC', header: 'Time', defaultVisible: true },
  { id: 'ClientHost', header: 'Client IP', defaultVisible: true },
  { id: 'RequestMethod', header: 'Method', defaultVisible: true },
  { id: 'RequestPath', header: 'Path', defaultVisible: true },
  { id: 'DownstreamStatus', header: 'Status', defaultVisible: true },
  { id: 'Duration', header: 'Resp. Time', defaultVisible: true },
  { id: 'ServiceName', header: 'Service', defaultVisible: true },
  { id: 'RouterName', header: 'Router', defaultVisible: true },
  { id: 'RequestHost', header: 'Host', defaultVisible: false },
  { id: 'RequestAddr', header: 'Request Addr', defaultVisible: false },
  { id: 'ClientPort', header: 'Client Port', defaultVisible: false },
  { id: 'RequestProtocol', header: 'Protocol', defaultVisible: false },
  { id: 'DownstreamContentSize', header: 'Content Size', defaultVisible: false },
  { id: 'OriginDuration', header: 'Origin Duration', defaultVisible: false },
  { id: 'Overhead', header: 'Overhead', defaultVisible: false },
  { id: 'request_User_Agent', header: 'User Agent', defaultVisible: false },
];

export default function RecentLogsTable({ logs }: Props) {
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allColumns.map(c => [c.id, c.defaultVisible]))
  );

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleColumnDefs = allColumns.filter(c => visibleColumns[c.id]);

  // Sort logs by most recent first and take latest 1000
  const sortedLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => {
        const timeA = new Date(a.StartUTC || a.StartLocal).getTime();
        const timeB = new Date(b.StartUTC || b.StartLocal).getTime();
        return timeB - timeA; // Most recent first
      })
      .slice(0, 1000); // Keep only latest 1000 entries
  }, [logs]);

  // Format duration from nanoseconds to milliseconds
  const formatDuration = (durationNs: number): string => {
    if (!durationNs) return 'N/A';
    const ms = durationNs / 1000000;
    return `${ms.toFixed(0)}ms`;
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Get status color
  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400 font-medium';
    if (status >= 300 && status < 400) return 'text-blue-600 dark:text-blue-400 font-medium';
    if (status >= 400 && status < 500) return 'text-yellow-600 dark:text-yellow-400 font-medium';
    if (status >= 500) return 'text-red-600 dark:text-red-400 font-medium';
    return 'text-muted-foreground';
  };

  // Format timestamp to match old design
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  };

  // Render cell content based on column ID
  const renderCell = (log: TraefikLog, columnId: string) => {
    const value = log[columnId as keyof TraefikLog];

    switch (columnId) {
      case 'StartUTC':
      case 'StartLocal':
        return <span className="font-mono text-xs">{formatTime(log.StartUTC || log.StartLocal)}</span>;
      
      case 'DownstreamStatus':
        return <span className={`font-mono font-semibold ${getStatusColor(log.DownstreamStatus)}`}>{log.DownstreamStatus}</span>;
      
      case 'Duration':
        return <span className="font-mono text-xs">{formatDuration(log.Duration)}</span>;
      
      case 'OriginDuration':
        return <span className="font-mono text-xs">{formatDuration(log.OriginDuration)}</span>;
      
      case 'Overhead':
        return <span className="font-mono text-xs">{formatDuration(log.Overhead)}</span>;
      
      case 'DownstreamContentSize':
      case 'RequestContentSize':
        return <span className="font-mono text-xs">{formatBytes(value as number)}</span>;
      
      case 'ClientHost':
      case 'RequestAddr':
        return <span className="font-mono text-xs">{value || 'N/A'}</span>;
      
      case 'RequestMethod':
        const methodColors: Record<string, string> = {
          'GET': 'text-blue-600 dark:text-blue-400',
          'POST': 'text-green-600 dark:text-green-400',
          'PUT': 'text-yellow-600 dark:text-yellow-400',
          'DELETE': 'text-red-600 dark:text-red-400',
          'PATCH': 'text-purple-600 dark:text-purple-400',
        };
        const methodColor = methodColors[value as string] || 'text-muted-foreground';
        return <span className={`font-semibold ${methodColor}`}>{value}</span>;
      
      case 'RequestPath':
        return <span className="font-mono text-xs truncate block max-w-xs" title={value as string}>{value || '/'}</span>;
      
      default:
        return <span className="text-xs truncate block">{String(value || 'N/A')}</span>;
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <Card title="Recent Logs" icon={<List className="w-5 h-5 text-muted-foreground" />}>
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No logs available
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Recent Logs"
      icon={
        <div className="relative">
          <details className="relative">
            <summary className="flex items-center gap-1 cursor-pointer text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors list-none">
              <span className="font-medium">Columns</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-popover border rounded-lg shadow-lg z-50 p-2 space-y-1 max-h-80 overflow-y-auto">
              {allColumns.map(col => (
                <label
                  key={col.id}
                  className="flex items-center gap-2 text-sm px-2 py-1.5 hover:bg-accent rounded-md cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!visibleColumns[col.id]}
                    onChange={() => toggleColumn(col.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>{col.header}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
      }
    >
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              {visibleColumnDefs.map(col => (
                <th
                  key={col.id}
                  className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground bg-muted/50 first:rounded-tl-lg last:rounded-tr-lg"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedLogs.slice(0, 100).map((log, idx) => (
              <tr
                key={`${log.StartUTC}-${idx}`}
                className="hover:bg-muted/50 transition-colors"
              >
                {visibleColumnDefs.map(col => (
                  <td
                    key={col.id}
                    className="py-2.5 px-4 align-middle"
                    title={String(log[col.id as keyof TraefikLog] || '')}
                  >
                    {renderCell(log, col.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing latest {Math.min(100, sortedLogs.length)} of {sortedLogs.length} logs (max 1000)</span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live updates
        </span>
      </div>
    </Card>
  );
}