'use client';

import { List } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { TraefikLog } from '@/lib/types';

interface Props {
	logs: TraefikLog[];
}

export default function RecentLogsTable({ logs }: Props) {
	return (
		<Card title="Recent Logs" icon={<List className="w-5 h-5 text-gray-600" />}>
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead className="text-xs text-muted-foreground">
						<tr className="border-b">
							<th className="py-2 pr-4 text-left">Time</th>
							<th className="py-2 pr-4 text-left">Client IP</th>
							<th className="py-2 pr-4 text-left">Method</th>
							<th className="py-2 pr-4 text-left">Path</th>
							<th className="py-2 pr-4 text-left">Status</th>
							<th className="py-2 pr-4 text-left">Resp. Time</th>
							<th className="py-2 pr-4 text-left">Service</th>
							<th className="py-2 pr-4 text-left">Router</th>
						</tr>
					</thead>
					<tbody>
						{logs.slice(0, 50).map((log, idx) => (
							<tr key={idx} className="border-b last:border-b-0">
								<td className="py-2 pr-4 whitespace-nowrap">{new Date(log.StartUTC || log.StartLocal).toLocaleString()}</td>
								<td className="py-2 pr-4 whitespace-nowrap font-mono">{log.ClientAddr}</td>
								<td className="py-2 pr-4 whitespace-nowrap">{log.RequestMethod}</td>
								<td className="py-2 pr-4 truncate max-w-[24rem]" title={log.RequestPath}>{log.RequestPath}</td>
								<td className="py-2 pr-4 whitespace-nowrap">
									<span className={statusClass(log.DownstreamStatus)}>{log.DownstreamStatus}</span>
								</td>
								<td className="py-2 pr-4 whitespace-nowrap">{Math.round(log.Duration / 1_000_000)}ms</td>
								<td className="py-2 pr-4 whitespace-nowrap truncate max-w-[12rem]">{log.ServiceName || 'N/A'}</td>
								<td className="py-2 pr-4 whitespace-nowrap truncate max-w-[12rem]">{log.RouterName || 'N/A'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

function statusClass(status: number): string {
	if (status >= 500) return 'text-red-600 font-semibold';
	if (status >= 400) return 'text-yellow-600 font-semibold';
	if (status >= 300) return 'text-blue-600 font-semibold';
	return 'text-green-600 font-semibold';
}


