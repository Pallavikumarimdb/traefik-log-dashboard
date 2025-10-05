'use client';

import { Globe } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { formatNumber } from '@/lib/utils';

interface HostMetric {
	host: string;
	count: number;
}

interface Props {
	hosts: HostMetric[];
}

export default function TopRequestHostsCard({ hosts }: Props) {
	if (!hosts || hosts.length === 0) {
		return (
			<Card title="Top Request Hosts" icon={<Globe className="w-5 h-5 text-indigo-600" />}>
				<div className="text-center py-8 text-muted-foreground">No host data available</div>
			</Card>
		);
	}

	return (
		<Card title="Top Request Hosts" icon={<Globe className="w-5 h-5 text-indigo-600" />}>
			<div className="space-y-2">
				{hosts.slice(0, 10).map((item, idx) => (
					<div key={idx} className="flex items-center justify-between text-sm">
						<span className="truncate font-medium flex-1" title={item.host}>{item.host}</span>
						<span className="text-xs text-muted-foreground">{formatNumber(item.count)}</span>
					</div>
				))}
			</div>
		</Card>
	);
}


