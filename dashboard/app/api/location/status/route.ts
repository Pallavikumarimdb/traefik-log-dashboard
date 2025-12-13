import { NextResponse } from 'next/server';
import maxmind from 'maxmind';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * REFACTOR: Changed to check local GeoIP database instead of calling agent
 * Dashboard now handles all GeoIP lookups locally
 */
export async function GET() {
  try {
    // Check for GeoIP database locally
    const dbPath = process.env.GEOIP_DB_PATH || path.join(process.cwd(), 'node_modules', 'geolite2-redist', 'dist', 'GeoLite2-City.mmdb');

    let available = false;
    let dbLocation = '';

    // Check if database file exists
    try {
      if (fs.existsSync(dbPath)) {
        // Try to open it to verify it's valid
        const reader = await maxmind.open(dbPath);
        if (reader) {
          available = true;
          dbLocation = dbPath;
        }
      }
    } catch (err) {
      console.error('GeoIP database check failed:', err);
      available = false;
    }

    const data = {
      enabled: true, // Always enabled in dashboard
      available: available,
      database: dbLocation,
      message: available
        ? 'GeoIP database available (local)'
        : 'GeoIP database not found. Install geolite2-redist npm package or set GEOIP_DB_PATH',
    };

    const res = NextResponse.json(data);
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');

    return res;
  } catch (error) {
    console.error('Location status API error:', error);
    return NextResponse.json(
      {
        enabled: true,
        available: false,
        error: 'Failed to check location status',
        details: String(error)
      },
      { status: 500 }
    );
  }
}