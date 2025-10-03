import { GeoLocation } from './types';

// Simple IP to country mapping (subset for demo)
const IP_COUNTRY_MAP: Record<string, string> = {
  // US ranges
  '8.': 'United States',
  '12.': 'United States',
  '24.': 'United States',
  '50.': 'United States',
  '66.': 'United States',
  '67.': 'United States',
  '98.': 'United States',
  '173.': 'United States',
  '192.': 'United States',
  '198.': 'United States',
  
  // Europe
  '80.': 'United Kingdom',
  '81.': 'United Kingdom',
  '82.': 'Germany',
  '83.': 'Germany',
  '84.': 'France',
  '85.': 'France',
  '86.': 'Spain',
  '87.': 'Italy',
  '88.': 'Netherlands',
  '89.': 'Poland',
  
  // Asia
  '58.': 'China',
  '59.': 'China',
  '60.': 'China',
  '61.': 'Australia',
  '103.': 'Singapore',
  '106.': 'Japan',
  '114.': 'India',
  '115.': 'South Korea',
  '116.': 'China',
  '117.': 'Japan',
  
  // Other
  '200.': 'Brazil',
  '201.': 'Brazil',
  '41.': 'South Africa',
  '196.': 'Egypt',
};

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
};

/**
 * Extract IP address from client address
 */
export function extractIP(clientAddr: string): string {
  if (!clientAddr) return '';
  
  // Remove port if present
  const parts = clientAddr.split(':');
  return parts[0];
}

/**
 * Get country from IP address (simplified lookup)
 */
export function getCountryFromIP(ip: string): string {
  if (!ip) return 'Unknown';
  
  // Try to match IP prefix
  for (const [prefix, country] of Object.entries(IP_COUNTRY_MAP)) {
    if (ip.startsWith(prefix)) {
      return country;
    }
  }
  
  // Check for private IPs
  if (ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.') || ip === '127.0.0.1') {
    return 'Private Network';
  }
  
  return 'Unknown';
}

/**
 * Get coordinates for a country
 */
export function getCountryCoordinates(country: string): { lat: number; lon: number } | null {
  return COUNTRY_COORDS[country] || null;
}

/**
 * Convert client addresses to geo locations with aggregation
 */
export function aggregateGeoLocations(clientAddresses: string[]): GeoLocation[] {
  const countryMap = new Map<string, number>();
  
  for (const addr of clientAddresses) {
    const ip = extractIP(addr);
    const country = getCountryFromIP(ip);
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  }
  
  return Array.from(countryMap.entries())
    .map(([country, count]) => {
      const coords = getCountryCoordinates(country);
      return {
        country,
        count,
        latitude: coords?.lat,
        longitude: coords?.lon,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Format geo location for display
 */
export function formatGeoLocation(location: GeoLocation): string {
  return `${location.country} (${location.count})`;
}

/**
 * Get top N countries by request count
 */
export function getTopCountries(locations: GeoLocation[], limit: number = 10): GeoLocation[] {
  return locations
    .filter(loc => loc.country !== 'Unknown' && loc.country !== 'Private Network')
    .slice(0, limit);
}