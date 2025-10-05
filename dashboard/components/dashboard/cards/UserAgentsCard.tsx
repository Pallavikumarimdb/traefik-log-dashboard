'use client';

import { Monitor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserAgentMetrics } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface UserAgentsCardProps {
	userAgents: UserAgentMetrics[];
}

export default function UserAgentsCard({ userAgents }: UserAgentsCardProps) {
	if (userAgents.length === 0) {
		return (
			<Card>
				<CardHeader className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Monitor className="w-5 h-5 text-indigo-600" />
						<CardTitle>User Agents (Browsers)</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					<div className="text-center py-8 text-muted-foreground">No user agent data available</div>
				</CardContent>
			</Card>
		);
	}

	const maxCount = Math.max(...userAgents.map(ua => ua.count));

	// Browser colors
	const browserColors: Record<string, string> = {
		Chrome: 'bg-yellow-500',
		Safari: 'bg-blue-500',
		Firefox: 'bg-orange-500',
		Edge: 'bg-cyan-500',
		Opera: 'bg-red-500',
		IE: 'bg-blue-600',
		Unknown: 'bg-gray-500',
	};

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Monitor className="w-5 h-5 text-indigo-600" />
					<CardTitle>User Agents (Browsers)</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<div className="space-y-3">
					{userAgents.map((ua, index) => (
						<div key={index} className="space-y-1">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium">{ua.browser}</span>
								<div className="flex items-center gap-3 text-xs text-muted-foreground">
									<span>{formatNumber(ua.count)}</span>
									<span className="w-12 text-right">{ua.percentage.toFixed(1)}%</span>
								</div>
							</div>
							<div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div className={`h-full transition-all ${browserColors[ua.browser] || 'bg-gray-500'}`} style={{ width: `${(ua.count / maxCount) * 100}%` }} />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}