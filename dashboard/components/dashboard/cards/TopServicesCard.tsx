'use client';

import { Server } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { BackendMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface Props {
	services: BackendMetrics[]; // reuse BackendMetrics shape
}

export default function TopServicesCard({ services }: Props) {
	if (!services || services.length === 0) {
		return (
			<Card title="Top Services" icon={<Server className="w-5 h-5 text-green-600" />}>
				<div className="text-center py-8 text-muted-foreground">No service data available</div>
			</Card>
		);
	}

	return (
		<Card title="Top Services" icon={<Server className="w-5 h-5 text-green-600" />}>
			<div className="space-y-3">
				{services.slice(0, 10).map((svc, idx) => (
					<div key={idx} className="flex items-center justify-between text-sm">
						<span className="truncate font-medium flex-1">{svc.name}</span>
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							<span>{formatNumber(svc.requests)}</span>
							<span>{svc.avgDuration.toFixed(0)}ms</span>
							<span className={svc.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>
								{svc.errorRate.toFixed(1)}%
							</span>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}


