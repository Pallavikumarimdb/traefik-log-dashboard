// dashboard/app/api/services/status/route.ts
import { NextResponse } from 'next/server';
import { serviceManager } from '@/lib/services/service-manager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/services/status - Get status of all services
 */
export async function GET() {
  try {
    const status = serviceManager.getStatus();
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Failed to get service status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve service status' },
      { status: 500 }
    );
  }
}
