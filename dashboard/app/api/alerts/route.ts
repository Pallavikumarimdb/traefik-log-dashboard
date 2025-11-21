// dashboard/app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAlertRules,
  addAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertRuleById,
} from '@/lib/db/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/alerts - Get all alert rules
 */
export async function GET() {
  try {
    const alerts = getAllAlertRules();
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Failed to get alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve alert rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts - Add new alert rule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.trigger_type || !body.webhook_ids || !body.parameters) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger_type, webhook_ids, parameters' },
        { status: 400 }
      );
    }

    // Validate trigger_type
    if (!['interval', 'threshold', 'event'].includes(body.trigger_type)) {
      return NextResponse.json(
        { error: 'Invalid trigger_type. Must be "interval", "threshold", or "event"' },
        { status: 400 }
      );
    }

    // Validate interval if trigger_type is interval
    if (body.trigger_type === 'interval' && !body.interval) {
      return NextResponse.json(
        { error: 'Interval is required for interval-based alerts' },
        { status: 400 }
      );
    }

    // Validate webhook_ids is an array
    if (!Array.isArray(body.webhook_ids) || body.webhook_ids.length === 0) {
      return NextResponse.json(
        { error: 'webhook_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate parameters is an array
    if (!Array.isArray(body.parameters) || body.parameters.length === 0) {
      return NextResponse.json(
        { error: 'parameters must be a non-empty array' },
        { status: 400 }
      );
    }

    const newAlert = addAlertRule({
      name: body.name,
      description: body.description,
      enabled: body.enabled !== undefined ? body.enabled : true,
      agent_id: body.agent_id,
      webhook_ids: body.webhook_ids,
      trigger_type: body.trigger_type,
      interval: body.interval,
      parameters: body.parameters,
    });

    return NextResponse.json({ alert: newAlert }, { status: 201 });
  } catch (error) {
    console.error('Failed to add alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to add alert rule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts - Update alert rule
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Alert rule ID is required' },
        { status: 400 }
      );
    }

    const alert = getAlertRuleById(id);
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }

    updateAlertRule(id, updates);
    const updatedAlert = getAlertRuleById(id);

    return NextResponse.json({ alert: updatedAlert });
  } catch (error) {
    console.error('Failed to update alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts - Delete alert rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Alert rule ID is required' },
        { status: 400 }
      );
    }

    deleteAlertRule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete alert rule';
    console.error('Failed to delete alert rule:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
