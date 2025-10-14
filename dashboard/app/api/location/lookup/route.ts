import { NextRequest, NextResponse } from 'next/server';
import { agentConfig } from '@/lib/agent-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ips } = body;

    if (!ips || !Array.isArray(ips) || ips.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ips array is required' },
        { status: 400 }
      );
    }

    // Limit to 1000 IPs per request
    if (ips.length > 1000) {
      return NextResponse.json(
        { error: 'Too many IPs (max 1000)' },
        { status: 400 }
      );
    }

    const AGENT_API_URL = agentConfig.url;
    const AGENT_API_TOKEN = agentConfig.token;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (AGENT_API_TOKEN) {
      headers['Authorization'] = `Bearer ${AGENT_API_TOKEN}`;
    }

    const response = await fetch(
      `${AGENT_API_URL}/api/location/lookup`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ ips }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Agent location error:', error);
      return NextResponse.json(
        { error: `Agent error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const res = NextResponse.json(data);
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    
    return res;
  } catch (error) {
    console.error('Location lookup API error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup locations', details: String(error) },
      { status: 500 }
    );
  }
}