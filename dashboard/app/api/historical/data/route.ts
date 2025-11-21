// dashboard/app/api/historical/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  queryHistoricalData,
  getHistoricalStats,
  cleanupHistoricalData,
  exportHistoricalData,
} from '@/lib/db/historical-database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/historical/data - Query historical data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = {
      agent_id: searchParams.get('agent_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const data = queryHistoricalData(query);
    const stats = getHistoricalStats(query.agent_id);

    return NextResponse.json({ data, stats });
  } catch (error) {
    console.error('Failed to query historical data:', error);
    return NextResponse.json(
      { error: 'Failed to query historical data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/historical/data?action=cleanup - Clean up old historical data
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'cleanup') {
      const deletedCount = cleanupHistoricalData();
      return NextResponse.json({
        success: true,
        deleted_count: deletedCount,
        message: `Cleaned up ${deletedCount} old entries`,
      });
    }

    if (action === 'export') {
      const body = await request.json();
      const exportData = exportHistoricalData(body.query || {});

      return new NextResponse(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="historical-data-${Date.now()}.json"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "cleanup" or "export"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to perform historical data action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
