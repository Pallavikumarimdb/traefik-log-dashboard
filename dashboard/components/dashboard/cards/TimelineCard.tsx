'use client';

import { memo, useMemo } from 'react';
import { LineChart } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';
import { TimeSeriesPoint } from '@/lib/types';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart';

interface TimelineCardProps {
  timeline: TimeSeriesPoint[];
}

function TimelineCard({ timeline }: TimelineCardProps) {
  // Memoize expensive calculations - hooks before early returns
  const { peakValue, startLabel, endLabel } = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return { peakValue: 0, startLabel: '', endLabel: '' };
    }
    return {
      peakValue: Math.max(...timeline.map(t => t.value)),
      startLabel: timeline[0]?.label || new Date(timeline[0]?.timestamp).toLocaleTimeString(),
      endLabel: timeline[timeline.length - 1]?.label || new Date(timeline[timeline.length - 1]?.timestamp).toLocaleTimeString(),
    };
  }, [timeline]);

  if (!timeline || timeline.length === 0) {
    return (
      <Card title="Request Timeline" icon={<LineChart className="w-5 h-5 text-primary" />}>
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No timeline data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Request Timeline" icon={<LineChart className="w-5 h-5 text-primary" />}>
      <div className="h-64 w-full">
        <TimeSeriesChart data={timeline} />
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t text-xs text-muted-foreground">
        <span>{startLabel}</span>
        <span className="font-medium text-primary">
          Peak: {peakValue} req/min
        </span>
        <span>{endLabel}</span>
      </div>
    </Card>
  );
}

export default memo(TimelineCard);