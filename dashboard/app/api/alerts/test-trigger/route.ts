// dashboard/app/api/alerts/test-trigger/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAlertRuleById } from '@/lib/db/database';
import { alertEngine } from '@/lib/services/alert-engine';
import { DashboardMetrics } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/alerts/test-trigger - Manually trigger an alert for testing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, agentId, agentName } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    if (!agentId || !agentName) {
      return NextResponse.json(
        { error: 'Agent ID and name are required' },
        { status: 400 }
      );
    }

    // Get alert rule
    const alert = getAlertRuleById(alertId);
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }

    if (!alert.enabled) {
      return NextResponse.json(
        { error: 'Alert rule is disabled' },
        { status: 400 }
      );
    }

    // Create test metrics
    const testMetrics: DashboardMetrics = {
      requests: {
        total: 1850,
        perSecond: 15.2,
        change: 0,
      },
      responseTime: {
        average: 125,
        p95: 250,
        p99: 500,
        change: 0,
      },
      statusCodes: {
        status2xx: 1650,
        status3xx: 100,
        status4xx: 75,
        status5xx: 25,
        errorRate: 3.2,
      },
      topRoutes: [
        { path: '/api/users', count: 500, avgDuration: 45, method: 'GET' },
        { path: '/api/products', count: 350, avgDuration: 32, method: 'GET' },
        { path: '/health', count: 1000, avgDuration: 5, method: 'GET' },
      ],
      backends: [],
      routers: [],
      topRequestAddresses: [],
      topRequestHosts: [],
      topClientIPs: [
        { ip: '192.168.1.100', count: 150 },
        { ip: '10.0.0.50', count: 120 },
        { ip: '172.16.0.25', count: 95 },
      ],
      userAgents: [],
      timeline: [],
      errors: [],
      geoLocations: [
        { country: 'United States', city: 'New York', count: 200 },
        { country: 'United Kingdom', city: 'London', count: 150 },
        { country: 'Germany', city: 'Berlin', count: 100 },
      ],
      logs: [],
    };

    // Force evaluation by resetting execution time for this alert
    alertEngine.resetExecutionTimes();

    // Trigger the alert
    await alertEngine.evaluateAlerts(agentId, agentName, testMetrics);

    return NextResponse.json({
      success: true,
      message: 'Alert triggered successfully',
      alert: {
        id: alert.id,
        name: alert.name,
      },
    });
  } catch (error) {
    console.error('Failed to trigger test alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger test alert',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
