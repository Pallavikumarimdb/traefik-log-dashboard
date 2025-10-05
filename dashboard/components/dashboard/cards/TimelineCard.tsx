'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart';
import { TimeSeriesPoint } from '@/lib/types';

interface TimelineCardProps {
	timeline: TimeSeriesPoint[];
}

export default function TimelineCard({ timeline }: TimelineCardProps) {
	if (timeline.length === 0) {
		return (
			<Card>
				<CardHeader className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<TrendingUp className="w-5 h-5 text-blue-600" />
						<CardTitle>Request Timeline</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					<div className="text-center py-8 text-muted-foreground">No timeline data available</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<TrendingUp className="w-5 h-5 text-blue-600" />
					<CardTitle>Request Timeline</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<div className="h-64">
					<TimeSeriesChart data={timeline} />
				</div>
			</CardContent>
		</Card>
	);
}