import { NextResponse } from 'next/server';
import { agentConfig } from '@/lib/agent-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      `${AGENT_API_URL}/api/location/status`,
      {
        headers,
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      // If agent doesn't have location endpoint, return disabled status
      if (response.status === 404) {
        return NextResponse.json({
          enabled: false,
          available: false,
          message: 'Location service not available on agent'
        });
      }

      const error = await response.text();
      console.error('Agent location status error:', error);
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
    console.error('Location status API error:', error);
    return NextResponse.json(
      { 
        enabled: false,
        available: false,
        error: 'Failed to fetch location status',
        details: String(error) 
      },
      { status: 500 }
    );
  }
}