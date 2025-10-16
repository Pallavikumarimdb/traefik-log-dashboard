import { NextRequest, NextResponse } from 'next/server';
import { agentConfig } from '@/lib/agent-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || '0';
    const lines = searchParams.get('lines') || '100';

    const AGENT_API_URL = agentConfig.url;
    const AGENT_API_TOKEN = agentConfig.token;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (AGENT_API_TOKEN) {
      headers['Authorization'] = `Bearer ${AGENT_API_TOKEN}`;
    }

    const response = await fetch(
      `${AGENT_API_URL}/api/logs/error?position=${position}&lines=${lines}`,
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
    console.error('Error logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}