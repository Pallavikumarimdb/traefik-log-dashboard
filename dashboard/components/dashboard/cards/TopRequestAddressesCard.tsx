'use client';

import { Locate } from 'lucide-react';
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
			<Card title="Top Request Addresses" icon={<Locate className="w-5 h-5 text-blue-600" />}>
				<div className="text-center py-8 text-muted-foreground">No address data available</div>
			</Card>
		);
	}

	return (
		<Card title="Top Request Addresses" icon={<Locate className="w-5 h-5 text-blue-600" />}>
			<div className="space-y-2">
				{addresses.slice(0, 10).map((item, idx) => (
					<div key={idx} className="flex items-center justify-between text-sm">
						<span className="truncate font-medium flex-1" title={item.addr}>{item.addr}</span>
						<span className="text-xs text-muted-foreground">{formatNumber(item.count)}</span>
					</div>
				))}
			</div>
		</Card>
	);
}


