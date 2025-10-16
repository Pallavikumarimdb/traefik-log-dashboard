import { NextRequest, NextResponse } from 'next/server';
import { agentConfig } from '@/lib/agent-config';

export const dynamic = 'force-dynamic'; // Prevent Next.js from caching
export const revalidate = 0; // No caching

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || '-2'; // Default to tracked position
    const lines = searchParams.get('lines') || '1000';
    const tail = searchParams.get('tail') || 'false';

    const AGENT_API_URL = agentConfig.url;
    const AGENT_API_TOKEN = agentConfig.token;

    console.log('Fetching from agent:', `${AGENT_API_URL}/api/logs/access?position=${position}&lines=${lines}&tail=${tail}`);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    };

    if (AGENT_API_TOKEN) {
      headers['Authorization'] = `Bearer ${AGENT_API_TOKEN}`;
    }

    // Build URL with all parameters
    const agentUrl = `${AGENT_API_URL}/api/logs/access?position=${position}&lines=${lines}&tail=${tail}`;

    const response = await fetch(agentUrl, { 
      headers,
      cache: 'no-store', // Prevent fetch caching
      next: { revalidate: 0 } // Next.js specific - no caching
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Agent error:', error);
      return NextResponse.json(
        { error: `Agent error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('Agent returned', data.logs?.length || 0, 'logs');
    
    // Add no-cache headers to response
    const res = NextResponse.json(data);
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    
    return res;
  } catch (error) {
    console.error('Access logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access logs', details: String(error) },
      { status: 500 }
    );
  }
}