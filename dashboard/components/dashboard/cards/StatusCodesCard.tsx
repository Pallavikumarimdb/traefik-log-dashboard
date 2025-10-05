'use client';

import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusCodeMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface StatusCodesCardProps {
	metrics: StatusCodeMetrics;
}

export default function StatusCodesCard({ metrics }: StatusCodesCardProps) {
	const total = metrics.status2xx + metrics.status3xx + metrics.status4xx + metrics.status5xx;

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<BarChart3 className="w-5 h-5 text-purple-600" />
					<CardTitle>Status Codes</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<div className="space-y-3">
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-green-600">2xx</span>
							<span className="font-semibold">{formatNumber(metrics.status2xx)}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-blue-600">3xx</span>
							<span className="font-semibold">{formatNumber(metrics.status3xx)}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-yellow-600">4xx</span>
							<span className="font-semibold">{formatNumber(metrics.status4xx)}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-red-600">5xx</span>
							<span className="font-semibold">{formatNumber(metrics.status5xx)}</span>
						</div>
					</div>

					{/* Status bar visualization */}
					{total > 0 && (
						<div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
							{metrics.status2xx > 0 && (
								<div className="bg-green-500" style={{ width: `${(metrics.status2xx / total) * 100}%` }} />
							)}
							{metrics.status3xx > 0 && (
								<div className="bg-blue-500" style={{ width: `${(metrics.status3xx / total) * 100}%` }} />
							)}
							{metrics.status4xx > 0 && (
								<div className="bg-yellow-500" style={{ width: `${(metrics.status4xx / total) * 100}%` }} />
							)}
							{metrics.status5xx > 0 && (
								<div className="bg-red-500" style={{ width: `${(metrics.status5xx / total) * 100}%` }} />
							)}
						</div>
					)}

					<div className="text-sm text-muted-foreground">
						Error Rate: <span className={`font-semibold ${metrics.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>{metrics.errorRate.toFixed(2)}%</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}