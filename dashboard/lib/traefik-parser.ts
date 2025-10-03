import { TraefikLog } from './types';

// CLF Pattern for Traefik logs
const CLF_PATTERN = /^(\S+) - (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)" (\d+) "([^"]*)" "([^"]*)" (\d+)ms/;

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
    } catch (e) {
      // If JSON parsing fails, try CLF
    }
  }

  // Try CLF format
  return parseCLFLog(logLine);
}

/**
 * Parse JSON format Traefik log
 */
function parseJSONLog(logLine: string): TraefikLog | null {
  try {
    const parsed = JSON.parse(logLine);
    
    // Convert JSON fields to TraefikLog structure
    return {
      ClientAddr: parsed.ClientAddr || parsed.clientAddr || '',
      ClientHost: parsed.ClientHost || parsed.clientHost || '',
      ClientPort: parsed.ClientPort || parsed.clientPort || '',
      ClientUsername: parsed.ClientUsername || parsed.clientUsername || '-',
      DownstreamContentSize: parsed.DownstreamContentSize || parsed.downstreamContentSize || 0,
      DownstreamStatus: parsed.DownstreamStatus || parsed.downstreamStatus || 0,
      Duration: parsed.Duration || parsed.duration || 0,
      OriginContentSize: parsed.OriginContentSize || parsed.originContentSize || 0,
      OriginDuration: parsed.OriginDuration || parsed.originDuration || 0,
      OriginStatus: parsed.OriginStatus || parsed.originStatus || 0,
      Overhead: parsed.Overhead || parsed.overhead || 0,
      RequestAddr: parsed.RequestAddr || parsed.requestAddr || '',
      RequestContentSize: parsed.RequestContentSize || parsed.requestContentSize || 0,
      RequestCount: parsed.RequestCount || parsed.requestCount || 0,
      RequestHost: parsed.RequestHost || parsed.requestHost || '',
      RequestMethod: parsed.RequestMethod || parsed.requestMethod || '',
      RequestPath: parsed.RequestPath || parsed.requestPath || '',
      RequestPort: parsed.RequestPort || parsed.requestPort || '',
      RequestProtocol: parsed.RequestProtocol || parsed.requestProtocol || '',
      RequestScheme: parsed.RequestScheme || parsed.requestScheme || '',
      RetryAttempts: parsed.RetryAttempts || parsed.retryAttempts || 0,
      RouterName: parsed.RouterName || parsed.routerName || '',
      ServiceAddr: parsed.ServiceAddr || parsed.serviceAddr || '',
      ServiceName: parsed.ServiceName || parsed.serviceName || '',
      ServiceURL: parsed.ServiceURL || parsed.serviceURL || '',
      StartLocal: parsed.StartLocal || parsed.startLocal || '',
      StartUTC: parsed.StartUTC || parsed.startUTC || '',
      entryPointName: parsed.entryPointName || parsed.EntryPointName || '',
      request_Referer: parsed.request_Referer || parsed.RequestReferer || '',
      request_User_Agent: parsed.request_User_Agent || parsed.RequestUserAgent || '',
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