'use client';

import { MapPin } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { formatNumber } from '@/lib/utils';

interface AddressMetric {
  addr: string;
  count: number;
}

interface Props {
  addresses: AddressMetric[];
}

export default function TopRequestAddressesCard({ addresses }: Props) {
  if (!addresses || addresses.length === 0) {
    return (
      <Card title="Top Request Addresses" icon={<MapPin className="w-5 h-5 text-red-600" />}>
        <div className="flex items-center justify-center py-8 text-sm text-gray-500">
          No request address data available
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...addresses.map(a => a.count), 1);
  const topAddresses = addresses.slice(0, 10);

  return (
    <Card title="Top Request Addresses" icon={<MapPin className="w-5 h-5 text-red-600" />}>
      <div className="space-y-3">
        {topAddresses.map((address, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono text-xs font-medium truncate flex-1 text-gray-900" title={address.addr}>
                {address.addr}
              </span>
              <span className="text-xs text-gray-500 font-medium ml-2">
                {formatNumber(address.count)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-500 ease-out"
                style={{ width: `${(address.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}