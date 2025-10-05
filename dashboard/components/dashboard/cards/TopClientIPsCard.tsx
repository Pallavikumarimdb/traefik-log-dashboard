'use client';

import { Fingerprint } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { formatNumber } from '@/lib/utils';

interface ClientMetric {
	ip: string;
	count: number;
}

interface Props {
	clients: ClientMetric[];
}

export default function TopClientIPsCard({ clients }: Props) {
	if (!clients || clients.length === 0) {
		return (
			<Card title="Top Client IPs" icon={<Fingerprint className="w-5 h-5 text-teal-600" />}>
				<div className="text-center py-8 text-muted-foreground">No client data available</div>
			</Card>
		);
	}

	return (
		<Card title="Top Client IPs" icon={<Fingerprint className="w-5 h-5 text-teal-600" />}>
			<div className="space-y-2">
				{clients.slice(0, 10).map((item, idx) => (
					<div key={idx} className="flex items-center justify-between text-sm">
						<span className="truncate font-medium flex-1" title={item.ip}>{item.ip}</span>
						<span className="text-xs text-muted-foreground">{formatNumber(item.count)}</span>
					</div>
				))}
			</div>
		</Card>
	);
}


