import { NextRequest, NextResponse } from 'next/server';
import { getSelectedAgent, getAgentById } from '@/lib/db/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    let agent;
    if (agentId) {
      agent = getAgentById(agentId);
      if (!agent) {
        return NextResponse.json(
          { error: `Agent with ID ${agentId} not found` },
          { status: 404 }
        );
      }
    } else {
      agent = getSelectedAgent();
      if (!agent) {
        return NextResponse.json(
          { error: 'No agent selected or available' },
          { status: 404 }
        );
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (agent.token) {
      headers['Authorization'] = `Bearer ${agent.token}`;
    }

    const response = await fetch(`${agent.url}/api/system/logs`, { headers });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Agent error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('System logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system logs' },
      { status: 500 }
    );
  }
}