import { NextResponse } from 'next/server';
import { agentConfig } from '@/lib/agent-config';

export async function GET() {
  try {
    const AGENT_API_URL = agentConfig.url;
    const AGENT_API_TOKEN = agentConfig.token;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (AGENT_API_TOKEN) {
      headers['Authorization'] = `Bearer ${AGENT_API_TOKEN}`;
    }

    const response = await fetch(
      `${AGENT_API_URL}/api/system/logs`,
      { headers }
    );

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