import { NextRequest, NextResponse } from 'next/server';
import maxmind from 'maxmind';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let reader: Awaited<ReturnType<typeof maxmind.open>> | null = null;

// Possible GeoIP database locations (in priority order)
const DB_PATHS = [
  process.env.GEOIP_DB_PATH,
  // Docker standalone location
  path.join(process.cwd(), 'geoip', 'GeoLite2-City.mmdb'),
  // Development (node_modules)
  path.join(process.cwd(), 'node_modules', 'geolite2-redist', 'dbs', 'GeoLite2-City.mmdb'),
].filter(Boolean) as string[];

async function getReader() {
  if (reader) return reader;

  // Find first available database
  for (const dbPath of DB_PATHS) {
    try {
      if (fs.existsSync(dbPath)) {
        reader = await maxmind.open(dbPath);
        console.warn('[GeoIP] Database loaded from:', dbPath);
        return reader;
      }
    } catch (error) {
      console.warn('[GeoIP] Failed to open database at', dbPath, error);
    }
  }

  console.error('[GeoIP] No database found in any location:', DB_PATHS);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ips }: { ips: string[] } = body;

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

    const lookup = await getReader();
    
    if (!lookup) {
      return NextResponse.json(
        { error: 'GeoIP database not available' },
        { status: 503 }
      );
    }

    const locations = [];

    for (const ip of ips) {
      try {
        // Skip private IPs check here as the library handles standard IPs
        // But we can add a quick check if needed, though the reader just returns null for private/unknown
        const result = lookup.get(ip);

        // Type guard to check if result is a CityResponse
        if (result && 'country' in result && result.country) {
          const cityResponse = result as { country?: { iso_code?: string }; city?: { names?: { en?: string } }; location?: { latitude?: number; longitude?: number } };
          locations.push({
            ipAddress: ip,
            country: cityResponse.country?.iso_code,
            city: cityResponse.city?.names?.en,
            latitude: cityResponse.location?.latitude,
            longitude: cityResponse.location?.longitude,
          });
        }
      } catch {
        // Ignore invalid IPs
        continue;
      }
    }
    
    const res = NextResponse.json({ locations });
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('Location lookup API error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup locations', details: String(error) },
      { status: 500 }
    );
  }
}