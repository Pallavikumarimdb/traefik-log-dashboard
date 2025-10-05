'use client';

import { Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponseTimeMetrics } from '@/lib/types';

interface ResponseTimeCardProps {
	metrics: ResponseTimeMetrics;
}

export default function ResponseTimeCard({ metrics }: ResponseTimeCardProps) {
	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Clock className="w-5 h-5 text-green-600" />
					<CardTitle>Response Time</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<div className="space-y-2">
					<div className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.average.toFixed(0)}ms</div>
					<div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
						<div>
							<span className="text-xs">P95:</span> {metrics.p95.toFixed(0)}ms
						</div>
						<div>
							<span className="text-xs">P99:</span> {metrics.p99.toFixed(0)}ms
						</div>
					</div>
					{metrics.change !== 0 && (
						<div className={`text-sm ${metrics.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
							{metrics.change < 0 ? '↓' : '↑'} {Math.abs(metrics.change).toFixed(1)}%
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}