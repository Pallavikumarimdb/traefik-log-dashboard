import { TraefikLog } from './types';

// CLF Pattern for Traefik logs
const CLF_PATTERN = /^(\S+) - (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)" (\d+) "([^"]*)" "([^"]*)" (\d+)ms/;

/**
 * Helper function to safely extract string values from parsed JSON
 * Handles multiple possible field name variations
 */
function getStringValue(parsed: any, keys: string[], defaultValue: string = ''): string {
  for (const key of keys) {
    if (parsed[key] !== undefined && parsed[key] !== null) {
      if (typeof parsed[key] === 'string') {
        return parsed[key];
      }
      // Convert to string if it's another type
      return String(parsed[key]);
    }
  }
  return defaultValue;
}

/**
 * Helper function to safely extract integer values from parsed JSON
 */
function getIntValue(parsed: any, keys: string[], defaultValue: number = 0): number {
  for (const key of keys) {
    const value = parsed[key];
    if (value !== undefined && value !== null) {
      if (typeof value === 'number') {
        return Math.floor(value);
      }
      if (typeof value === 'string') {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          return num;
        }
      }
    }
  }
  return defaultValue;
}

/**
 * Check if a parsed JSON object is a valid Traefik log entry
 */
function isValidTraefikLog(parsed: any): boolean {
  // Must have a timestamp
  if (!parsed.time && !parsed.Time && !parsed.StartUTC) {
    return false;
  }

  // For access logs, must have downstream status or request method
  if (parsed.DownstreamStatus !== undefined || parsed.downstreamStatus !== undefined) {
    return true;
  }
  
  if (parsed.RequestMethod !== undefined || parsed.requestMethod !== undefined) {
    return true;
  }

  // For error logs, check for level
  if (parsed.level) {
    const level = String(parsed.level).toLowerCase();
    return level === 'error' || level === 'warn' || level === 'info';
  }

  return false;
}

/**
 * Parse a single Traefik log line (auto-detect JSON or CLF format)
 */
export function parseTraefikLog(logLine: string): TraefikLog | null {
  if (!logLine || logLine.trim() === '') {
    return null;
  }

  // Try JSON first
  if (logLine.trim().startsWith('{')) {
    try {
      return parseJSONLog(logLine);
    } catch (_e) {
      // If JSON parsing fails, try CLF
    }
  }

  // Try CLF format
  return parseCLFLog(logLine);
}

/**
 * Parse JSON format Traefik log
 * Enhanced to handle multiple field name variations and validate entries
 */
function parseJSONLog(logLine: string): TraefikLog | null {
  try {
    const parsed = JSON.parse(logLine);
    
    // Validate that this is actually a Traefik log
    if (!isValidTraefikLog(parsed)) {
      return null;
    }
    
    // CRITICAL FIX: Handle request_ prefix fields with both hyphen and underscore
    // Traefik uses hyphen in header names: request_User-Agent, not request_User_Agent
    const requestUserAgent = parsed['request_User-Agent'] || 
                           parsed['request_User_Agent'] ||
                           parsed['RequestUserAgent'] ||
                           parsed['User-Agent'] ||
                           parsed['UserAgent'] ||
                           '';

    // Convert JSON fields to TraefikLog structure
    return {
      ClientAddr: getStringValue(parsed, ['ClientAddr', 'clientAddr']),
      ClientHost: getStringValue(parsed, ['ClientHost', 'clientHost']),
      ClientPort: getStringValue(parsed, ['ClientPort', 'clientPort']),
      ClientUsername: getStringValue(parsed, ['ClientUsername', 'clientUsername'], '-'),
      DownstreamContentSize: getIntValue(parsed, ['DownstreamContentSize', 'downstreamContentSize']),
      DownstreamStatus: getIntValue(parsed, ['DownstreamStatus', 'downstreamStatus']),
      Duration: getIntValue(parsed, ['Duration', 'duration']),
      OriginContentSize: getIntValue(parsed, ['OriginContentSize', 'originContentSize']),
      OriginDuration: getIntValue(parsed, ['OriginDuration', 'originDuration']),
      OriginStatus: getIntValue(parsed, ['OriginStatus', 'originStatus']),
      Overhead: getIntValue(parsed, ['Overhead', 'overhead']),
      RequestAddr: getStringValue(parsed, ['RequestAddr', 'requestAddr']),
      RequestContentSize: getIntValue(parsed, ['RequestContentSize', 'requestContentSize']),
      RequestCount: getIntValue(parsed, ['RequestCount', 'requestCount']),
      RequestHost: getStringValue(parsed, ['RequestHost', 'requestHost']),
      RequestMethod: getStringValue(parsed, ['RequestMethod', 'requestMethod']),
      RequestPath: getStringValue(parsed, ['RequestPath', 'requestPath']),
      RequestPort: getStringValue(parsed, ['RequestPort', 'requestPort']),
      RequestProtocol: getStringValue(parsed, ['RequestProtocol', 'requestProtocol']),
      RequestScheme: getStringValue(parsed, ['RequestScheme', 'requestScheme']),
      RetryAttempts: getIntValue(parsed, ['RetryAttempts', 'retryAttempts']),
      RouterName: getStringValue(parsed, ['RouterName', 'routerName']),
      ServiceAddr: getStringValue(parsed, ['ServiceAddr', 'serviceAddr']),
      ServiceName: getStringValue(parsed, ['ServiceName', 'serviceName']),
      ServiceURL: getStringValue(parsed, ['ServiceURL', 'serviceURL']),
      StartLocal: getStringValue(parsed, ['StartLocal', 'startLocal']),
      StartUTC: getStringValue(parsed, ['StartUTC', 'startUTC', 'time', 'Time']),
      entryPointName: getStringValue(parsed, ['entryPointName', 'EntryPointName']),
      request_Referer: parsed['request_Referer'] || parsed['request_referer'] || parsed['RequestReferer'] || parsed['Referer'] || '',
      request_User_Agent: requestUserAgent,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Parse CLF (Common Log Format) Traefik log
 */
function parseCLFLog(logLine: string): TraefikLog | null {
  const match = logLine.match(CLF_PATTERN);
  
  if (!match) {
    return null;
  }

  const [
    _,
    remoteAddr,
    username,
    timestamp,
    method,
    path,
    protocol,
    status,
    size,
    referer,
    userAgent,
    count,
    router,
    serviceURL,
    duration
  ] = match;

  // Extract host and port from remote address
  const [clientHost, clientPort] = remoteAddr.includes(':') 
    ? remoteAddr.split(':') 
    : [remoteAddr, ''];

  return {
    ClientAddr: remoteAddr,
    ClientHost: clientHost,
    ClientPort: clientPort,
    ClientUsername: username === '-' ? '' : username,
    DownstreamContentSize: parseInt(size) || 0,
    DownstreamStatus: parseInt(status) || 0,
    Duration: parseInt(duration) * 1000000, // Convert ms to ns
    OriginContentSize: 0,
    OriginDuration: 0,
    OriginStatus: parseInt(status) || 0,
    Overhead: 0,
    RequestAddr: remoteAddr,
    RequestContentSize: 0,
    RequestCount: parseInt(count) || 0,
    RequestHost: '',
    RequestMethod: method,
    RequestPath: path,
    RequestPort: '',
    RequestProtocol: protocol,
    RequestScheme: 'http',
    RetryAttempts: 0,
    RouterName: router,
    ServiceAddr: '',
    ServiceName: '',
    ServiceURL: serviceURL,
    StartLocal: timestamp,
    StartUTC: timestamp,
    entryPointName: '',
    request_Referer: referer === '-' ? '' : referer,
    request_User_Agent: userAgent === '-' ? '' : userAgent,
  };
}

/**
 * Parse multiple Traefik log lines
 * Filters out invalid entries automatically
 */
export function parseTraefikLogs(logLines: string[]): TraefikLog[] {
  return logLines
    .map(line => parseTraefikLog(line))
    .filter((log): log is TraefikLog => log !== null);
}

/**
 * Extract method from log line (quick parse without full parsing)
 */
export function extractMethod(logLine: string): string | null {
  const match = logLine.match(/"(\S+)\s+\S+\s+\S+"/);
  return match ? match[1] : null;
}

/**
 * Extract status code from log line (quick parse)
 */
export function extractStatus(logLine: string): number | null {
  const match = logLine.match(/"\s+(\d{3})\s+/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Extract timestamp from log line
 */
export function extractTimestamp(logLine: string): string | null {
  const match = logLine.match(/\[([^\]]+)\]/);
  return match ? match[1] : null;
}

/**
 * Extract client IP from various address formats
 */
export function extractIP(clientAddr: string): string {
  if (!clientAddr || clientAddr === '') {
    return 'unknown';
  }

  // Handle IPv6 addresses in brackets
  if (clientAddr.startsWith('[')) {
    const match = clientAddr.indexOf(']');
    if (match !== -1) {
      return clientAddr.substring(1, match);
    }
  }

  // Handle IPv4 with port
  if (clientAddr.includes('.') && clientAddr.includes(':')) {
    const lastColon = clientAddr.lastIndexOf(':');
    if (lastColon !== -1) {
      return clientAddr.substring(0, lastColon);
    }
  }

  // Handle IPv6 without brackets
  if (clientAddr.includes(':') && !clientAddr.includes('.')) {
    return clientAddr;
  }

  return clientAddr;
}