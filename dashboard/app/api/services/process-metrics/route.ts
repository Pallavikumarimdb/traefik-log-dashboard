// dashboard/app/api/services/process-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serviceManager } from '@/lib/services/service-manager';

export const dynamic = 'force-dynamic';

/**
 * POST /api/services/process-metrics - Process metrics for alerts and archival
 * This endpoint should be called from the dashboard when metrics are calculated
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, agentName, metrics } = body;

    if (!agentId || !agentName || !metrics) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, agentName, metrics' },
        { status: 400 }
      );
    }

    // Process metrics (evaluate alerts and update archival cache)
    await serviceManager.processMetrics(agentId, agentName, metrics);

    return NextResponse.json({
      success: true,
      message: 'Metrics processed successfully',
    });
  } catch (error) {
    console.error('Failed to process metrics:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}
