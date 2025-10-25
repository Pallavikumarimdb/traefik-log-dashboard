// dashboard/app/api/historical/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getHistoricalConfig,
  updateHistoricalConfig,
} from '@/lib/db/historical-database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/historical/config - Get historical data configuration
 */
export async function GET() {
  try {
    const config = getHistoricalConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Failed to get historical config:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve historical configuration' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/historical/config - Update historical data configuration
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate retention_days if provided
    if (body.retention_days !== undefined) {
      if (typeof body.retention_days !== 'number' || body.retention_days < 1) {
        return NextResponse.json(
          { error: 'retention_days must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Validate archive_interval if provided
    if (body.archive_interval !== undefined) {
      if (typeof body.archive_interval !== 'number' || body.archive_interval < 1) {
        return NextResponse.json(
          { error: 'archive_interval must be a positive number' },
          { status: 400 }
        );
      }
    }

    updateHistoricalConfig(body);
    const updatedConfig = getHistoricalConfig();

    return NextResponse.json({ config: updatedConfig });
  } catch (error) {
    console.error('Failed to update historical config:', error);
    return NextResponse.json(
      { error: 'Failed to update historical configuration' },
      { status: 500 }
    );
  }
}
