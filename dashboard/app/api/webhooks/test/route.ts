// dashboard/app/api/webhooks/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWebhookById } from '@/lib/db/database';
import { sendNotification } from '@/lib/services/notification-service';
import { AlertData } from '@/lib/types/alerting';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/test - Test a webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhook_id } = body;

    if (!webhook_id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const webhook = getWebhookById(webhook_id);
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Create test alert data
    const testData: AlertData = {
      timestamp: new Date().toISOString(),
      agent_name: 'Test Agent',
      agent_id: 'test-agent',
      metrics: {
        top_ips: [
          { ip: '192.168.1.100', count: 150 },
          { ip: '10.0.0.50', count: 120 },
          { ip: '172.16.0.25', count: 95 },
        ],
        top_locations: [
          { country: 'United States', city: 'New York', count: 200 },
          { country: 'United Kingdom', city: 'London', count: 150 },
          { country: 'Germany', city: 'Berlin', count: 100 },
        ],
        top_routes: [
          { path: '/api/users', count: 500, avgDuration: 45 },
          { path: '/api/products', count: 350, avgDuration: 32 },
          { path: '/health', count: 1000, avgDuration: 5 },
        ],
        top_status_codes: [
          { status: 200, count: 1500 },
          { status: 404, count: 50 },
          { status: 500, count: 10 },
        ],
        error_rate: 3.2,
        response_time: {
          average: 125,
          p95: 250,
          p99: 500,
        },
        request_count: 1850,
      },
    };

    // Test parameters - enable a few common ones
    const testParameters = [
      { parameter: 'request_count' as const, enabled: true },
      { parameter: 'error_rate' as const, enabled: true },
      { parameter: 'response_time' as const, enabled: true },
      { parameter: 'top_ips' as const, enabled: true, limit: 3 },
      { parameter: 'top_locations' as const, enabled: true, limit: 3 },
      { parameter: 'top_routes' as const, enabled: true, limit: 3 },
    ];

    const result = await sendNotification(
      webhook,
      testData,
      'Test Alert - Webhook Verification',
      testParameters
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send test notification',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to test webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test webhook',
      },
      { status: 500 }
    );
  }
}
