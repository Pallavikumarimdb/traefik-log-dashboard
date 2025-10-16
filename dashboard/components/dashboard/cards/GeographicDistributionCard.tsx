'use client';

import { MapPin } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { GeoLocation } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface Props {
  locations: GeoLocation[];
}

export default function GeographicDistributionCard({ locations }: Props) {
  if (!locations || locations.length === 0) {
    return (
      <Card title="Geographic Distribution" icon={<MapPin className="w-5 h-5 text-red-600" />}>
        <div className="text-center py-8 text-gray-500">No geographic data available</div>
      </Card>
    );
  }

  const topLocations = locations
    .filter(loc => loc.country !== 'Unknown' && loc.country !== 'Private Network')
    .slice(0, 10);
  const maxCount = Math.max(...topLocations.map(loc => loc.count));
  const totalRequests = locations.reduce((sum, loc) => sum + loc.count, 0);

  return (
    <Card title="Geographic Distribution" icon={<MapPin className="w-5 h-5 text-red-600" />}>
      <div className="space-y-3">
        {topLocations.map((location, index) => {
          const percentage = (location.count / totalRequests) * 100;
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{location.country}</span>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{formatNumber(location.count)}</span>
                  <span className="w-12 text-right font-semibold text-red-600">{percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(location.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}