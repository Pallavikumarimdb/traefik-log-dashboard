'use client';

import { Server } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { BackendMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface BackendsCardProps {
	backends: BackendMetrics[];
}

export default function BackendsCard({ backends }: BackendsCardProps) {
	if (backends.length === 0) {
		return (
			<Card>
				<CardHeader className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Server className="w-5 h-5 text-green-600" />
						<CardTitle>Backends (Services)</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					<div className="text-center py-8 text-muted-foreground">No backend data available</div>
				</CardContent>
			</Card>
		);
	}

	const maxRequests = Math.max(...backends.map(b => b.requests));

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Server className="w-5 h-5 text-green-600" />
					<CardTitle>Backends (Services)</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<div className="space-y-3">
					{backends.map((backend, index) => (
						<div key={index} className="space-y-1">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium truncate flex-1">{backend.name}</span>
								<div className="flex items-center gap-3 text-xs text-muted-foreground">
									<span>{formatNumber(backend.requests)}</span>
									<span>{backend.avgDuration.toFixed(0)}ms</span>
									<span className={backend.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>{backend.errorRate.toFixed(1)}%</span>
								</div>
							</div>
							<div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div className="h-full bg-green-500 transition-all" style={{ width: `${(backend.requests / maxRequests) * 100}%` }} />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}