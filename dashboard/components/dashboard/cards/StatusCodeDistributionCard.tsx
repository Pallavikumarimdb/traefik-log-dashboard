'use client';

import { BarChart3 } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { StatusCodeMetrics } from '@/lib/types';
import PieChart from '@/components/charts/PieChart';

interface Props {
    metrics: StatusCodeMetrics;
}

export default function StatusCodeDistributionCard({ metrics }: Props) {
    const total = metrics.status2xx + metrics.status3xx + metrics.status4xx + metrics.status5xx;

    if (total === 0) {
        return (
            <Card title="Status Code Distribution" icon={<BarChart3 className="w-5 h-5" />}>
                <div className="text-center py-8 text-muted-foreground">No data available</div>
            </Card>
        );
    }

    const chartData = [metrics.status2xx, metrics.status3xx, metrics.status4xx, metrics.status5xx];
    const chartLabels = ['2xx', '3xx', '4xx', '5xx'];

    return (
        <Card title="Status Code Distribution" icon={<BarChart3 className="w-5 h-5" />}>
            <div className="h-48 w-full">
                <PieChart
                    labels={chartLabels}
                    data={chartData}
                    backgroundColor={[
                        'hsl(var(--primary))',
                        'hsl(var(--primary) / 0.7)',
                        'hsl(var(--primary) / 0.5)',
                        'hsl(var(--primary) / 0.3)',
                    ]}
                />
            </div>
        </Card>
    );
}