'use client';

import { TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart';
import { TimeSeriesPoint } from '@/lib/types';

interface TimelineCardProps {
	timeline: TimeSeriesPoint[];
}

export default function TimelineCard({ timeline }: TimelineCardProps) {
	if (timeline.length === 0) {
		return (
			<Card title="Request Timeline" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
				<div className="text-center py-8 text-muted-foreground">No timeline data available</div>
			</Card>
		);
	}

	return (
		<Card title="Request Timeline" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
			<div className="h-64">
				<TimeSeriesChart data={timeline} />
			</div>
		</Card>
	);
}