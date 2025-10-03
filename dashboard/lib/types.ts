// Traefik Log Types
export interface TraefikLog {
  ClientAddr: string;
  ClientHost: string;
  ClientPort: string;
  ClientUsername: string;
  DownstreamContentSize: number;
  DownstreamStatus: number;
  Duration: number;
  OriginContentSize: number;
  OriginDuration: number;
  OriginStatus: number;
  Overhead: number;
  RequestAddr: string;
  RequestContentSize: number;
  RequestCount: number;
  RequestHost: string;
  RequestMethod: string;
  RequestPath: string;
  RequestPort: string;
  RequestProtocol: string;
  RequestScheme: string;
  RetryAttempts: number;
  RouterName: string;
  ServiceAddr: string;
  ServiceName: string;
  ServiceURL: string;
  StartLocal: string;
  StartUTC: string;
  entryPointName: string;
  request_Referer?: string;
  request_User_Agent?: string;
}

// API Response Types
export interface LogPosition {
  Position: number;
  Filename: string;
}

export interface LogsResponse {
  logs: string[];
  positions: LogPosition[];
}

export interface SystemStats {
  cpu: CPUStats;
  memory: MemoryStats;
  disk: DiskStats;
}

export interface CPUStats {
  usage_percent: number;
  cores: number;
}

export interface MemoryStats {
  total: number;
  available: number;
  used: number;
  used_percent: number;
  free: number;
}

export interface DiskStats {
  total: number;
  used: number;
  free: number;
  used_percent: number;
}

export interface LogFileSize {
  name: string;
  size: number;
  extension: string;
}

export interface LogFilesSummary {
  total_size: number;
  log_files_size: number;
  compressed_files_size: number;
  total_files: number;
  log_files_count: number;
  compressed_files_count: number;
}

export interface LogSizesResponse {
  files: LogFileSize[];
  summary: LogFilesSummary;
}

export interface StatusResponse {
  status: string;
  message: string;
  access_log_path: string;
  error_log_path: string;
  access_log_exists: boolean;
  error_log_exists: boolean;
  system_monitoring_enabled: boolean;
}

// Dashboard Metrics Types
export interface RequestMetrics {
  total: number;
  perSecond: number;
  change: number;
}

export interface ResponseTimeMetrics {
  average: number;
  p95: number;
  p99: number;
  change: number;
}

export interface StatusCodeMetrics {
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  errorRate: number;
}

export interface RouteMetrics {
  path: string;
  count: number;
  avgDuration: number;
  method: string;
}

export interface BackendMetrics {
  name: string;
  requests: number;
  avgDuration: number;
  errorRate: number;
}

export interface RouterMetrics {
  name: string;
  requests: number;
  avgDuration: number;
  service: string;
}

export interface GeoLocation {
  country: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  count: number;
}

export interface UserAgentMetrics {
  browser: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ErrorLog {
  timestamp: string;
  level: string;
  message: string;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

// Dashboard State Types
export interface DashboardState {
  logs: TraefikLog[];
  metrics: DashboardMetrics;
  systemStats?: SystemStats;
  loading: boolean;
  error?: string;
  lastUpdate: Date;
}

export interface DashboardMetrics {
  requests: RequestMetrics;
  responseTime: ResponseTimeMetrics;
  statusCodes: StatusCodeMetrics;
  topRoutes: RouteMetrics[];
  backends: BackendMetrics[];
  routers: RouterMetrics[];
  geoLocations: GeoLocation[];
  userAgents: UserAgentMetrics[];
  timeline: TimeSeriesPoint[];
  errors: ErrorLog[];
}

// Config Types
export interface DashboardConfig {
  refreshInterval: number;
  maxLogs: number;
  agentUrl: string;
  authToken?: string;
  demoMode: boolean;
}

// Filter Types
export interface LogFilter {
  method?: string[];
  status?: number[];
  router?: string[];
  service?: string[];
  timeRange?: TimeRange;
  search?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

// UI Component Props Types
export interface CardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

export interface ChartProps {
  data: ChartData;
  height?: number;
  loading?: boolean;
  options?: any;
}