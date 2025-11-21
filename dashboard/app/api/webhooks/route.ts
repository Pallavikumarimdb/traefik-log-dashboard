// dashboard/app/api/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllWebhooks,
  addWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookById,
} from '@/lib/db/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/webhooks - Get all webhooks
 */
export async function GET() {
  try {
    const webhooks = getAllWebhooks();
    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Failed to get webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks - Add new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.type || !body.url) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, url' },
        { status: 400 }
      );
    }

    // Validate webhook type
    if (body.type !== 'discord' && body.type !== 'telegram') {
      return NextResponse.json(
        { error: 'Invalid webhook type. Must be "discord" or "telegram"' },
        { status: 400 }
      );
    }

    const newWebhook = addWebhook({
      name: body.name,
      type: body.type,
      url: body.url,
      enabled: body.enabled !== undefined ? body.enabled : true,
      description: body.description,
    });

    return NextResponse.json({ webhook: newWebhook }, { status: 201 });
  } catch (error) {
    console.error('Failed to add webhook:', error);
    return NextResponse.json(
      { error: 'Failed to add webhook' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks - Update webhook
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const webhook = getWebhookById(id);
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    updateWebhook(id, updates);
    const updatedWebhook = getWebhookById(id);

    return NextResponse.json({ webhook: updatedWebhook });
  } catch (error) {
    console.error('Failed to update webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks - Delete webhook
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    deleteWebhook(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete webhook';
    console.error('Failed to delete webhook:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
