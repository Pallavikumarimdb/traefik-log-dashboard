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
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
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
}

// Default client instance
export const apiClient = new APIClient();