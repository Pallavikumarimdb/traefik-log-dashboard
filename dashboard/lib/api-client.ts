import {
  LogsResponse,
  SystemStats,
  LogSizesResponse,
  StatusResponse,
} from './types';

export class APIClient {
  private baseURL: string;
  private authToken?: string;

  constructor(baseURL?: string, authToken?: string) {
    // Default to empty string to use relative URLs (dashboard's own API routes)
    // The dashboard's API routes will then proxy to the agent
    this.baseURL = baseURL || '';
    this.authToken = authToken;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Add cache control headers to prevent stale data
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Add timestamp to prevent caching
    const url = `${this.baseURL}${endpoint}${endpoint.includes('?') ? '&' : '?'}_t=${Date.now()}`;

    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store', // Prevent browser caching
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<StatusResponse> {
    return this.fetch<StatusResponse>('/api/logs/status');
  }

  /**
   * Get access logs
   */
  async getAccessLogs(
    position: number = 0,
    lines: number = 1000
  ): Promise<LogsResponse> {
    const params = new URLSearchParams({
      position: position.toString(),
      lines: lines.toString(),
    });
    return this.fetch<LogsResponse>(`/api/logs/access?${params}`);
  }

  /**
   * Get error logs
   */
  async getErrorLogs(
    position: number = 0,
    lines: number = 100
  ): Promise<LogsResponse> {
    const params = new URLSearchParams({
      position: position.toString(),
      lines: lines.toString(),
    });
    return this.fetch<LogsResponse>(`/api/logs/error?${params}`);
  }

  /**
   * Get specific log file
   */
  async getLog(
    filename: string,
    position: number = 0,
    lines: number = 100
  ): Promise<LogsResponse> {
    const params = new URLSearchParams({
      filename,
      position: position.toString(),
      lines: lines.toString(),
    });
    return this.fetch<LogsResponse>(`/api/logs/get?${params}`);
  }

  /**
   * Get system resources
   */
  async getSystemResources(): Promise<SystemStats> {
    return this.fetch<SystemStats>('/api/system/resources');
  }

  /**
   * Get log file sizes
   */
  async getLogSizes(): Promise<LogSizesResponse> {
    return this.fetch<LogSizesResponse>('/api/system/logs');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetch('/api/logs/status');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Set base URL
   */
  setBaseURL(url: string) {
    this.baseURL = url;
  }

  /**
 * Lookup locations for IP addresses
 */
async lookupLocations(ips: string[]): Promise<{
  locations: Array<{
    ipAddress: string;
    country: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }>;
  count: number;
}> {
  return this.fetch('/api/location/lookup', {
    method: 'POST',
    body: JSON.stringify({ ips }),
  });
}

/**
 * Get location service status
 */
async getLocationStatus(): Promise<{
  enabled: boolean;
  available: boolean;
  city_db: string;
  country_db: string;
}> {
  return this.fetch('/api/location/status');
}
}

// Default client instance
export const apiClient = new APIClient();