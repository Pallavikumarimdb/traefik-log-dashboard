import { GeoLocation, TraefikLog } from './types';
import { extractIP, lookupGeoIP, isPrivateIP } from './geoip';

// Country coordinates for map visualization
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  'United States': { lat: 37.0902, lon: -95.7129 },
  'United Kingdom': { lat: 55.3781, lon: -3.4360 },
  'Germany': { lat: 51.1657, lon: 10.4515 },
  'France': { lat: 46.2276, lon: 2.2137 },
  'Spain': { lat: 40.4637, lon: -3.7492 },
  'Italy': { lat: 41.8719, lon: 12.5674 },
  'Netherlands': { lat: 52.1326, lon: 5.2913 },
  'Poland': { lat: 51.9194, lon: 19.1451 },
  'China': { lat: 35.8617, lon: 104.1954 },
  'Australia': { lat: -25.2744, lon: 133.7751 },
  'Singapore': { lat: 1.3521, lon: 103.8198 },
  'Japan': { lat: 36.2048, lon: 138.2529 },
  'India': { lat: 20.5937, lon: 78.9629 },
  'South Korea': { lat: 35.9078, lon: 127.7669 },
  'Brazil': { lat: -14.2350, lon: -51.9253 },
  'South Africa': { lat: -30.5595, lon: 22.9375 },
  'Egypt': { lat: 26.8206, lon: 30.8025 },
  'Hong Kong': { lat: 22.3193, lon: 114.1694 },
  'Canada': { lat: 56.1304, lon: -106.3468 },
  'Mexico': { lat: 23.6345, lon: -102.5528 },
  'Turkey': { lat: 38.9637, lon: 35.2433 },
  'Saudi Arabia': { lat: 23.8859, lon: 45.0792 },
  'UAE': { lat: 23.4241, lon: 53.8478 },
  'Argentina': { lat: -38.4161, lon: -63.6167 },
  'Russia': { lat: 61.5240, lon: 105.3188 },
  'Indonesia': { lat: -0.7893, lon: 113.9213 },
  'Thailand': { lat: 15.8700, lon: 100.9925 },
  'Vietnam': { lat: 14.0583, lon: 108.2772 },
  'Philippines': { lat: 12.8797, lon: 121.7740 },
  'Malaysia': { lat: 4.2105, lon: 101.9758 },
  'Myanmar': { lat: 21.9162, lon: 95.9560 },
  'Sri Lanka': { lat: 7.8731, lon: 80.7718 },
  'Pakistan': { lat: 30.3753, lon: 69.3451 },
  'Bangladesh': { lat: 23.6850, lon: 90.3563 },
  'Iran': { lat: 32.4279, lon: 53.6880 },
  'Iraq': { lat: 33.2232, lon: 43.6793 },
  'Israel': { lat: 31.0461, lon: 34.8516 },
  'New Zealand': { lat: -40.9006, lon: 174.8860 },
  'Sweden': { lat: 60.1282, lon: 18.6435 },
  'Norway': { lat: 60.4720, lon: 8.4689 },
  'Denmark': { lat: 56.2639, lon: 9.5018 },
  'Finland': { lat: 61.9241, lon: 25.7482 },
  'Belgium': { lat: 50.5039, lon: 4.4699 },
  'Switzerland': { lat: 46.8182, lon: 8.2275 },
  'Austria': { lat: 47.5162, lon: 14.5501 },
  'Portugal': { lat: 39.3999, lon: -8.2245 },
  'Greece': { lat: 39.0742, lon: 21.8243 },
  'Ireland': { lat: 53.4129, lon: -8.2439 },
  'Romania': { lat: 45.9432, lon: 24.9668 },
  'Czech Republic': { lat: 49.8175, lon: 15.4730 },
  'Hungary': { lat: 47.1625, lon: 19.5033 },
  'Ukraine': { lat: 48.3794, lon: 31.1656 },
  'Colombia': { lat: 4.5709, lon: -74.2973 },
  'Chile': { lat: -35.6751, lon: -71.5430 },
  'Peru': { lat: -9.1900, lon: -75.0152 },
  'Venezuela': { lat: 6.4238, lon: -66.5897 },
  'Kenya': { lat: -0.0236, lon: 37.9062 },
  'Nigeria': { lat: 9.0820, lon: 8.6753 },
  'Morocco': { lat: 31.7917, lon: -7.0926 },
  'Algeria': { lat: 28.0339, lon: 1.6596 },
  'Taiwan': { lat: 23.6978, lon: 120.9605 },
  'Nepal': { lat: 28.3949, lon: 84.1240 },
};

/**
 * Get coordinates for a country
 */
export function getCountryCoordinates(country: string): { lat: number; lon: number } | null {
  return COUNTRY_COORDS[country] || null;
}

/**
 * Convert TraefikLogs to geo locations with API lookup and aggregation
 * This is the main function that should be called with await
 */
export async function aggregateGeoLocations(
  logs: TraefikLog[],
  onProgress?: (current: number, total: number) => void
): Promise<GeoLocation[]> {
  // Extract unique IPs from logs
  const uniqueIPs = new Set<string>();
  
  for (const log of logs) {
    const clientAddr = log.ClientHost || log.ClientAddr || '';
    if (!clientAddr) continue;
    
    const ip = extractIP(clientAddr);
    if (ip && !isPrivateIP(ip)) {
      uniqueIPs.add(ip);
    }
  }
  
  // If no valid IPs, return empty
  if (uniqueIPs.size === 0) {
    return [];
  }
  
  // Lookup GeoIP data for all unique IPs (with caching and progress)
  const geoDataMap = await lookupGeoIP(Array.from(uniqueIPs), onProgress);
  
  // Count requests per country
  const countryMap = new Map<string, { count: number; city?: string; lat?: number; lon?: number }>();
  
  for (const log of logs) {
    const clientAddr = log.ClientHost || log.ClientAddr || '';
    if (!clientAddr) continue;
    
    const ip = extractIP(clientAddr);
    
    if (isPrivateIP(ip)) {
      // Handle private IPs
      const existing = countryMap.get('Private Network') || { count: 0 };
      countryMap.set('Private Network', { count: existing.count + 1 });
      continue;
    }
    
    const geoData = geoDataMap.get(ip);
    if (!geoData) continue;
    
    const country = geoData.country;
    const existing = countryMap.get(country);
    
    if (existing) {
      existing.count++;
    } else {
      const coords = getCountryCoordinates(country) || { lat: geoData.latitude, lon: geoData.longitude };
      countryMap.set(country, {
        count: 1,
        city: geoData.city,
        lat: coords?.lat || geoData.latitude,
        lon: coords?.lon || geoData.longitude,
      });
    }
  }
  
  // Convert to GeoLocation array
  return Array.from(countryMap.entries())
    .map(([country, data]) => ({
      country,
      count: data.count,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Synchronous fallback for initial render (uses cache only)
 * Returns cached data or placeholder
 */
export function aggregateGeoLocationsSync(logs: TraefikLog[]): GeoLocation[] {
  // For initial render, just return placeholder
  // The async version will be called to populate real data
  return [];
}

/**
 * Format geo location for display
 */
export function formatGeoLocation(location: GeoLocation): string {
  return `${location.country} (${location.count})`;
}

/**
 * Get top N countries by request count (excluding Unknown/Private)
 */
export function getTopCountries(locations: GeoLocation[], limit: number = 10): GeoLocation[] {
  return locations
    .filter(loc => loc.country !== 'Unknown' && loc.country !== 'Private Network')
    .slice(0, limit);
}

// Re-export functions from geoip for convenience
export { extractIP, isPrivateIP, clearGeoCache, getCacheStats } from './geoip';