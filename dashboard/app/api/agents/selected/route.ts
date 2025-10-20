// dashboard/app/api/agents/selected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSelectedAgent, setSelectedAgentId, getAgentById } from '@/lib/db/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agents/selected - Get currently selected agent
 */
export async function GET() {
  try {
    const agent = getSelectedAgent();
    
    if (!agent) {
      return NextResponse.json(
        { error: 'No agent selected or available' },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Failed to get selected agent:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve selected agent' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/selected - Set selected agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    setSelectedAgentId(agentId);

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Failed to set selected agent:', error);
    return NextResponse.json(
      { error: 'Failed to set selected agent' },
      { status: 500 }
    );
  }
}