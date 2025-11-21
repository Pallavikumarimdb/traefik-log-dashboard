// API endpoint for creating metric snapshots
import { NextRequest, NextResponse } from 'next/server';
import { createMetricSnapshot } from '@/lib/services/metric-snapshot-service';
import { saveMetricSnapshot } from '@/lib/db/database';
import { AlertInterval } from '@/lib/types/alerting';
import { TraefikLog } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/services/create-snapshot
 * Creates and stores a metric snapshot for a specific time window
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, agentName, logs, interval } = body;

    // Validate required fields
    if (!agentId || !agentName || !logs || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, agentName, logs, interval' },
        { status: 400 }
      );
    }

    // Validate interval
    const validIntervals: AlertInterval[] = ['5m', '15m', '30m', '1h', '6h', '12h', '24h'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` },
        { status: 400 }
      );
    }

    // Create snapshot from logs
    const snapshot = createMetricSnapshot(
      logs as TraefikLog[],
      agentId,
      agentName,
      { interval }
    );

    // Save snapshot to database
    const stored = saveMetricSnapshot(snapshot);

    return NextResponse.json({
      success: true,
      snapshot: {
        id: stored.id,
        timestamp: stored.timestamp,
        window_start: stored.window_start,
        window_end: stored.window_end,
        interval: stored.interval,
        log_count: stored.log_count,
      },
    });
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    return NextResponse.json(
      {
        error: 'Failed to create snapshot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
