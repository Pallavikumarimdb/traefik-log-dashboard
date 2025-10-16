'use client';

import { Server } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { BackendMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface Props {
  services: BackendMetrics[];
}

export default function TopServicesCard({ services }: Props) {
  if (!services || services.length === 0) {
    return (
      <Card title="Top Services" icon={<Server className="w-5 h-5 text-red-600" />}>
        <div className="flex items-center justify-center py-8 text-sm text-gray-500">
          No service data available
        </div>
      </Card>
    );
  }

  const maxRequests = Math.max(...services.map(s => s.requests), 1);
  const topServices = services.slice(0, 10);

  return (
    <Card title="Top Services" icon={<Server className="w-5 h-5 text-red-600" />}>
      <div className="space-y-4">
        {topServices.map((service, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-red-50 rounded text-red-600">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium truncate text-gray-900" title={service.name}>
                    {service.name}
                  </span>
                </div>
                {service.url && (
                  <div className="ml-8 mt-1">
                    <span className="text-xs text-gray-500 truncate block" title={service.url}>
                      {service.url}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 whitespace-nowrap">
                <span className="font-medium">{formatNumber(service.requests)}</span>
                <span className="text-gray-400">•</span>
                <span>{service.avgDuration.toFixed(0)}ms</span>
                <span className="text-gray-400">•</span>
                <span className={service.errorRate > 5 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {service.errorRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="ml-8">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500 ease-out"
                  style={{ width: `${(service.requests / maxRequests) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}