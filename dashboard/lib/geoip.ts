// GeoIP service using ip-api.com (free, no API key required)
// CRITICAL: Free tier limited to 45 requests/minute
// Using batch endpoint: 1 request = up to 100 IPs

interface IPApiResponse {
  status: 'success' | 'fail';
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
  message?: string;
}

interface CachedGeoData {
  country: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
}

// In-memory cache for GeoIP results
const geoCache = new Map<string, CachedGeoData>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days (longer cache)

// Rate limiting configuration
const BATCH_SIZE = 100; // Maximum IPs per batch request
const MAX_REQUESTS_PER_MINUTE = 45; // API limit
const MIN_DELAY_BETWEEN_REQUESTS = Math.ceil((60 * 1000) / MAX_REQUESTS_PER_MINUTE); // ~1.4 seconds
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout

// Request queue management
let requestQueue: Array<{
  ips: string[];
  resolve: (value: Map<string, CachedGeoData>) => void;
  reject: (reason: any) => void;
}> = [];

let isProcessingQueue = false;
let lastRequestTime = 0;
let requestCount = 0;
let resetTime = Date.now() + 60000;

/**
 * Extract IP address from client address
 */
export function extractIP(clientAddr: string): string {
  if (!clientAddr) return '';
  
  // Handle IPv6 addresses
  if (clientAddr.includes('[')) {
    const match = clientAddr.match(/\[([^\]]+)\]/);
    return match ? match[1] : clientAddr;
  }
  
  // Remove port for IPv4
  const lastColonIndex = clientAddr.lastIndexOf(':');
  if (lastColonIndex > 0 && !clientAddr.includes('::')) {
    return clientAddr.substring(0, lastColonIndex);
  }
  
  return clientAddr;
}

/**
 * Check if IP is private/local
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip) return true;
  
  return (
    ip.startsWith('10.') ||
    ip.startsWith('172.') ||
    ip.startsWith('192.168.') ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip.startsWith('::1') ||
    ip.startsWith('fe80:') ||
    ip.startsWith('fc00:') ||
    ip.startsWith('fd00:')
  );
}

/**
 * Get cached GeoIP data if available and not expired
 */
function getCachedGeoData(ip: string): CachedGeoData | null {
  const cached = geoCache.get(ip);
  if (!cached) return null;
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    geoCache.delete(ip);
    return null;
  }
  
  return cached;
}

/**
 * Wait for rate limit to be available
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  
  // Reset counter if minute has passed
  if (now > resetTime) {
    requestCount = 0;
    resetTime = now + 60000;
  }
  
  // Check if we've hit the rate limit
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = resetTime - now;
    console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime + 100));
    requestCount = 0;
    resetTime = Date.now() + 60000;
  }
  
  // Ensure minimum delay between requests
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest)
    );
  }
}

/**
 * Lookup multiple IPs using batch endpoint (more efficient)
 * Batch endpoint: POST to /batch with JSON array of IPs
 * Counts as 1 request regardless of number of IPs (up to 100)
 */
async function lookupBatchIPs(ips: string[]): Promise<Map<string, CachedGeoData>> {
  const results = new Map<string, CachedGeoData>();
  
  try {
    // Wait for rate limit clearance
    await waitForRateLimit();
    
    // Limit batch size
    const batchIPs = ips.slice(0, BATCH_SIZE);
    
    // Update rate limit tracking
    lastRequestTime = Date.now();
    requestCount++;
    
    console.log(`GeoIP batch lookup: ${batchIPs.length} IPs (request ${requestCount}/${MAX_REQUESTS_PER_MINUTE})`);
    
    // Batch API endpoint (POST request with JSON array)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const response = await fetch('http://ip-api.com/batch?fields=status,message,country,city,lat,lon,query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchIPs),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Handle rate limit response
    if (response.status === 429) {
      console.error('Rate limit exceeded! Waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      // Retry once
      return await lookupBatchIPs(ips);
    }
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data: IPApiResponse[] = await response.json();
    
    // Process results
    data.forEach((item) => {
      const ip = item.query || '';
      if (!ip) return;
      
      if (item.status === 'success') {
        const geoData: CachedGeoData = {
          country: item.country || 'Unknown',
          city: item.city,
          latitude: item.lat,
          longitude: item.lon,
          timestamp: Date.now(),
        };
        
        // Cache and store result
        geoCache.set(ip, geoData);
        results.set(ip, geoData);
      } else {
        const fallback: CachedGeoData = {
          country: 'Unknown',
          timestamp: Date.now(),
        };
        geoCache.set(ip, fallback);
        results.set(ip, fallback);
      }
    });
    
    return results;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('GeoIP request timed out');
    } else {
      console.error('Batch GeoIP lookup failed:', error);
    }
    
    // Return fallback for all IPs
    ips.forEach(ip => {
      const fallback: CachedGeoData = {
        country: 'Unknown',
        timestamp: Date.now(),
      };
      results.set(ip, fallback);
    });
    
    return results;
  }
}

/**
 * Process the request queue with rate limiting
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) break;
    
    try {
      const results = await lookupBatchIPs(request.ips);
      request.resolve(results);
    } catch (error) {
      request.reject(error);
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Add request to queue and process
 */
function queueBatchLookup(ips: string[]): Promise<Map<string, CachedGeoData>> {
  return new Promise((resolve, reject) => {
    requestQueue.push({ ips, resolve, reject });
    processQueue();
  });
}

/**
 * Main function: Lookup GeoIP data for multiple IPs with caching and rate limiting
 */
export async function lookupGeoIP(
  ips: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, CachedGeoData>> {
  const results = new Map<string, CachedGeoData>();
  const ipsToLookup: string[] = [];
  
  // Check cache first and filter out private IPs
  for (const ip of ips) {
    if (isPrivateIP(ip)) {
      results.set(ip, {
        country: 'Private Network',
        timestamp: Date.now(),
      });
      continue;
    }
    
    const cached = getCachedGeoData(ip);
    if (cached) {
      results.set(ip, cached);
    } else {
      ipsToLookup.push(ip);
    }
  }
  
  // If all IPs were cached or private, return immediately
  if (ipsToLookup.length === 0) {
    return results;
  }
  
  console.log(`GeoIP lookup: ${ipsToLookup.length} uncached IPs (${results.size} cached)`);
  
  // Split into batches of BATCH_SIZE
  const batches: string[][] = [];
  for (let i = 0; i < ipsToLookup.length; i += BATCH_SIZE) {
    batches.push(ipsToLookup.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Processing ${batches.length} batch(es) for GeoIP lookup`);
  
  // Process batches with rate limiting
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    if (onProgress) {
      onProgress(i + 1, batches.length);
    }
    
    const batchResults = await queueBatchLookup(batch);
    batchResults.forEach((data, ip) => {
      results.set(ip, data);
    });
  }
  
  return results;
}

/**
 * Get country from IP with API fallback
 */
export async function getCountryFromIP(ip: string): Promise<string> {
  if (isPrivateIP(ip)) {
    return 'Private Network';
  }
  
  const cached = getCachedGeoData(ip);
  if (cached) {
    return cached.country;
  }
  
  const results = await lookupGeoIP([ip]);
  const result = results.get(ip);
  return result?.country || 'Unknown';
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearGeoCache(): void {
  geoCache.clear();
  console.log('GeoIP cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: number; requestCount: number; resetIn: number } {
  return {
    size: geoCache.size,
    entries: geoCache.size,
    requestCount,
    resetIn: Math.max(0, Math.ceil((resetTime - Date.now()) / 1000)),
  };
}

/**
 * Get queue status
 */
export function getQueueStatus(): { pending: number; processing: boolean } {
  return {
    pending: requestQueue.length,
    processing: isProcessingQueue,
  };
}