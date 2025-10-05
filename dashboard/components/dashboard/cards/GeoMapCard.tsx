'use client';

import { MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { GeoLocation } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface GeoMapCardProps {
	locations: GeoLocation[];
}

export default function GeoMapCard({ locations }: GeoMapCardProps) {
	if (locations.length === 0) {
		return (
			<Card>
				<CardHeader className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<MapPin className="w-5 h-5 text-orange-600" />
						<CardTitle>Geographic Distribution</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					<div className="text-center py-8 text-muted-foreground">No geographic data available</div>
				</CardContent>
			</Card>
		);
	}

	const topLocations = locations.filter(loc => loc.country !== 'Unknown' && loc.country !== 'Private Network').slice(0, 10);
	const maxCount = Math.max(...topLocations.map(loc => loc.count));
	const totalRequests = locations.reduce((sum, loc) => sum + loc.count, 0);

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<MapPin className="w-5 h-5 text-orange-600" />
					<CardTitle>Geographic Distribution</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<div className="space-y-3">
					{topLocations.map((location, index) => {
						const percentage = (location.count / totalRequests) * 100;
						return (
							<div key={index} className="space-y-1">
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium">{location.country}</span>
									<div className="flex items-center gap-3 text-xs text-muted-foreground">
										<span>{formatNumber(location.count)}</span>
										<span className="w-12 text-right">{percentage.toFixed(1)}%</span>
									</div>
								</div>
								<div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
									<div className="h-full bg-orange-500 transition-all" style={{ width: `${(location.count / maxCount) * 100}%` }} />
								</div>
							</div>
						);
					})}
				</div>

				{locations.length > 10 && (
					<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-muted-foreground text-center">
						+{locations.length - 10} more countries
					</div>
				)}
			</CardContent>
		</Card>
	);
}