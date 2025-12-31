import { NextResponse } from 'next/server';
import maxmind from 'maxmind';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Possible GeoIP database locations (in priority order)
const DB_PATHS = [
  process.env.GEOIP_DB_PATH,
  // Docker standalone location
  path.join(process.cwd(), 'geoip', 'GeoLite2-City.mmdb'),
  // Development (node_modules)
  path.join(process.cwd(), 'node_modules', 'geolite2-redist', 'dbs', 'GeoLite2-City.mmdb'),
].filter(Boolean) as string[];

/**
 * Check GeoIP database status
 */
export async function GET() {
  try {
    let available = false;
    let dbLocation = '';

    // Check each possible location
    for (const dbPath of DB_PATHS) {
      try {
        if (fs.existsSync(dbPath)) {
          const reader = await maxmind.open(dbPath);
          if (reader) {
            available = true;
            dbLocation = dbPath;
            break;
          }
        }
      } catch {
        // Try next path
      }
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