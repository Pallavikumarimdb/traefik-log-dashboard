// dashboard/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents, addAgent, updateAgent, deleteAgent, getAgentById } from '@/lib/db/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agents - Get all agents
 */
export async function GET() {
  try {
    const agents = getAllAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Failed to get agents:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve agents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents - Add new agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.url || !body.token || !body.location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, token, location' },
        { status: 400 }
      );
    }

    const newAgent = addAgent({
      name: body.name,
      url: body.url,
      token: body.token,
      location: body.location,
      description: body.description,
      tags: body.tags,
    });

    return NextResponse.json({ agent: newAgent }, { status: 201 });
  } catch (error) {
    console.error('Failed to add agent:', error);
    return NextResponse.json(
      { error: 'Failed to add agent' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents - Update agent
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const agent = getAgentById(id);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    updateAgent(id, updates);
    const updatedAgent = getAgentById(id);

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents - Delete agent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    deleteAgent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete agent';
    console.error('Failed to delete agent:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}