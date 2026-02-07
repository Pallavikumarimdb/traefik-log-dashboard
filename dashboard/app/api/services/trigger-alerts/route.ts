import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/services/background-scheduler';
import { serviceManager } from '@/lib/services/service-manager';
import { initDatabase, syncEnvAgents } from '@/lib/db/database';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const provided = request.headers.get('x-cron-secret');
  return provided === cronSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const schedulerEnabled = process.env.ENABLE_BACKGROUND_SCHEDULER !== 'false';
    if (!schedulerEnabled) {
      return NextResponse.json(
        { error: 'Background scheduler disabled (ENABLE_BACKGROUND_SCHEDULER=false)' },
        { status: 503 }
      );
    }

    // Ensure services and DB are ready before running a cycle
    initDatabase();
    syncEnvAgents();
    serviceManager.initialize();

    await backgroundScheduler.runOnce();

    return NextResponse.json({
      success: true,
      message: 'Alert scheduler run triggered',
    });
  } catch (error) {
    console.error('Failed to trigger alert scheduler run:', error);
    return NextResponse.json(
      { error: 'Failed to trigger alert scheduler run' },
      { status: 500 }
    );
  }
}
