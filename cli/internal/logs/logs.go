package logs

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"
)

// TraefikLog represents a single Traefik access log entry
type TraefikLog struct {
	ClientAddr            string  `json:"ClientAddr"`
	ClientHost            string  `json:"ClientHost"`
	ClientPort            string  `json:"ClientPort"`
	ClientUsername        string  `json:"ClientUsername"`
	DownstreamContentSize int     `json:"DownstreamContentSize"`
	DownstreamStatus      int     `json:"DownstreamStatus"`
	Duration              int64   `json:"Duration"`
	OriginContentSize     int     `json:"OriginContentSize"`
	OriginDuration        int64   `json:"OriginDuration"`
	OriginStatus          int     `json:"OriginStatus"`
	Overhead              int64   `json:"Overhead"`
	RequestAddr           string  `json:"RequestAddr"`
	RequestContentSize    int     `json:"RequestContentSize"`
	RequestCount          int     `json:"RequestCount"`
	RequestHost           string  `json:"RequestHost"`
	RequestMethod         string  `json:"RequestMethod"`
	RequestPath           string  `json:"RequestPath"`
	RequestPort           string  `json:"RequestPort"`
	RequestProtocol       string  `json:"RequestProtocol"`
	RequestScheme         string  `json:"RequestScheme"`
	RetryAttempts         int     `json:"RetryAttempts"`
	RouterName            string  `json:"RouterName"`
	ServiceAddr           string  `json:"ServiceAddr"`
	ServiceName           string  `json:"ServiceName"`
	ServiceURL            string  `json:"ServiceURL"`
	StartLocal            string  `json:"StartLocal"`
	StartUTC              string  `json:"StartUTC"`
	EntryPointName        string  `json:"entryPointName"`
	RequestReferer        string  `json:"request_Referer"`
	RequestUserAgent      string  `json:"request_User_Agent"`
}

// Metrics represents calculated metrics from logs
type Metrics struct {
	TotalRequests   int              `json:"total_requests"`
	RequestsPerSec  float64          `json:"requests_per_sec"`
	AvgResponseTime float64          `json:"avg_response_time"`
	P95ResponseTime float64          `json:"p95_response_time"`
	P99ResponseTime float64          `json:"p99_response_time"`
	Status2xx       int              `json:"status_2xx"`
	Status3xx       int              `json:"status_3xx"`
	Status4xx       int              `json:"status_4xx"`
	Status5xx       int              `json:"status_5xx"`
	ErrorRate       float64          `json:"error_rate"`
	TopRoutes       []RouteMetric    `json:"top_routes"`
	TopServices     []ServiceMetric  `json:"top_services"`
	TopRouters      []RouterMetric   `json:"top_routers"`
}

// RouteMetric represents metrics for a specific route
type RouteMetric struct {
	Path        string  `json:"path"`
	Count       int     `json:"count"`
	AvgDuration float64 `json:"avg_duration"`
	Method      string  `json:"method"`
}

// ServiceMetric represents metrics for a specific service
type ServiceMetric struct {
	Name        string  `json:"name"`
	Count       int     `json:"count"`
	AvgDuration float64 `json:"avg_duration"`
	ErrorRate   float64 `json:"error_rate"`
}

// RouterMetric represents metrics for a specific router
type RouterMetric struct {
	Name        string  `json:"name"`
	Count       int     `json:"count"`
	AvgDuration float64 `json:"avg_duration"`
}

// SystemStats represents system resource statistics
type SystemStats struct {
	CPU    CPUStats    `json:"cpu"`
	Memory MemoryStats `json:"memory"`
	Disk   DiskStats   `json:"disk"`
}

// CPUStats represents CPU usage statistics
type CPUStats struct {
	UsagePercent float64 `json:"usagePercent"`
	Cores        int     `json:"cores"`
}

// MemoryStats represents memory usage statistics
type MemoryStats struct {
	Total       uint64  `json:"total"`
	Available   uint64  `json:"available"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
	Free        uint64  `json:"free"`
}

// DiskStats represents disk usage statistics
type DiskStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"usedPercent"`
}

// FetchAccessLogs fetches access logs from the agent
func FetchAccessLogs(agentURL, authToken string, maxLogs int) ([]TraefikLog, error) {
	url := fmt.Sprintf("%s/api/logs/access?lines=%d", agentURL, maxLogs)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	if authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", authToken))
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("agent returned status %d: %s", resp.StatusCode, body)
	}
	
	var result struct {
		Logs []string `json:"logs"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	
	// Parse log lines
	var logs []TraefikLog
	for _, line := range result.Logs {
		if line == "" {
			continue
		}
		
		var log TraefikLog
		if err := json.Unmarshal([]byte(line), &log); err == nil {
			logs = append(logs, log)
		}
	}
	
	return logs, nil
}

// FetchErrorLogs fetches error logs from the agent
func FetchErrorLogs(agentURL, authToken string, maxLogs int) ([]string, error) {
	url := fmt.Sprintf("%s/api/logs/error?lines=%d", agentURL, maxLogs)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	if authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", authToken))
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("agent returned status %d: %s", resp.StatusCode, body)
	}
	
	var result struct {
		Logs []string `json:"logs"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	
	return result.Logs, nil
}

// FetchSystemStats fetches system statistics from the agent
func FetchSystemStats(agentURL, authToken string) (*SystemStats, error) {
	url := fmt.Sprintf("%s/api/system/resources", agentURL)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	if authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", authToken))
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("agent returned status %d: %s", resp.StatusCode, body)
	}
	
	var stats SystemStats
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, err
	}
	
	return &stats, nil
}

// CalculateMetrics calculates metrics from a slice of logs
func CalculateMetrics(logs []TraefikLog) *Metrics {
	if len(logs) == 0 {
		return &Metrics{}
	}
	
	metrics := &Metrics{
		TotalRequests: len(logs),
	}
	
	// Calculate time span for requests/sec
	var minTime, maxTime time.Time
	for i, log := range logs {
		t, err := time.Parse(time.RFC3339, log.StartUTC)
		if err != nil {
			continue
		}
		if i == 0 {
			minTime, maxTime = t, t
		} else {
			if t.Before(minTime) {
				minTime = t
			}
			if t.After(maxTime) {
				maxTime = t
			}
		}
	}
	
	if !minTime.IsZero() && !maxTime.IsZero() {
		duration := maxTime.Sub(minTime).Seconds()
		if duration > 0 {
			metrics.RequestsPerSec = float64(len(logs)) / duration
		}
	}
	
	// Calculate response times and status codes
	var durations []float64
	routeMap := make(map[string]*RouteMetric)
	serviceMap := make(map[string]*ServiceMetric)
	routerMap := make(map[string]*RouterMetric)
	
	for _, log := range logs {
		// Duration in milliseconds
		durationMs := float64(log.Duration) / 1e6
		durations = append(durations, durationMs)
		
		// Status codes
		switch {
		case log.DownstreamStatus >= 200 && log.DownstreamStatus < 300:
			metrics.Status2xx++
		case log.DownstreamStatus >= 300 && log.DownstreamStatus < 400:
			metrics.Status3xx++
		case log.DownstreamStatus >= 400 && log.DownstreamStatus < 500:
			metrics.Status4xx++
		case log.DownstreamStatus >= 500 && log.DownstreamStatus < 600:
			metrics.Status5xx++
		}
		
		// Routes
		if log.RequestPath != "" {
			if route, ok := routeMap[log.RequestPath]; ok {
				route.Count++
				route.AvgDuration = (route.AvgDuration*float64(route.Count-1) + durationMs) / float64(route.Count)
			} else {
				routeMap[log.RequestPath] = &RouteMetric{
					Path:        log.RequestPath,
					Count:       1,
					AvgDuration: durationMs,
					Method:      log.RequestMethod,
				}
			}
		}
		
		// Services
		if log.ServiceName != "" {
			if service, ok := serviceMap[log.ServiceName]; ok {
				service.Count++
				service.AvgDuration = (service.AvgDuration*float64(service.Count-1) + durationMs) / float64(service.Count)
				if log.DownstreamStatus >= 400 {
					service.ErrorRate = service.ErrorRate + 1.0/float64(service.Count)
				}
			} else {
				errorRate := 0.0
				if log.DownstreamStatus >= 400 {
					errorRate = 1.0
				}
				serviceMap[log.ServiceName] = &ServiceMetric{
					Name:        log.ServiceName,
					Count:       1,
					AvgDuration: durationMs,
					ErrorRate:   errorRate,
				}
			}
		}
		
		// Routers
		if log.RouterName != "" {
			if router, ok := routerMap[log.RouterName]; ok {
				router.Count++
				router.AvgDuration = (router.AvgDuration*float64(router.Count-1) + durationMs) / float64(router.Count)
			} else {
				routerMap[log.RouterName] = &RouterMetric{
					Name:        log.RouterName,
					Count:       1,
					AvgDuration: durationMs,
				}
			}
		}
	}
	
	// Calculate percentiles
	if len(durations) > 0 {
		metrics.AvgResponseTime = average(durations)
		metrics.P95ResponseTime = percentile(durations, 95)
		metrics.P99ResponseTime = percentile(durations, 99)
	}
	
	// Calculate error rate
	errorCount := metrics.Status4xx + metrics.Status5xx
	if metrics.TotalRequests > 0 {
		metrics.ErrorRate = float64(errorCount) / float64(metrics.TotalRequests)
	}
	
	// Convert maps to slices and sort
	for _, route := range routeMap {
		metrics.TopRoutes = append(metrics.TopRoutes, *route)
	}
	sortRoutes(metrics.TopRoutes)
	if len(metrics.TopRoutes) > 10 {
		metrics.TopRoutes = metrics.TopRoutes[:10]
	}
	
	for _, service := range serviceMap {
		metrics.TopServices = append(metrics.TopServices, *service)
	}
	sortServices(metrics.TopServices)
	if len(metrics.TopServices) > 10 {
		metrics.TopServices = metrics.TopServices[:10]
	}
	
	for _, router := range routerMap {
		metrics.TopRouters = append(metrics.TopRouters, *router)
	}
	sortRouters(metrics.TopRouters)
	if len(metrics.TopRouters) > 10 {
		metrics.TopRouters = metrics.TopRouters[:10]
	}
	
	return metrics
}

// GenerateDemoLogs generates demo log data for testing
func GenerateDemoLogs(count int) []TraefikLog {
	methods := []string{"GET", "POST", "PUT", "DELETE", "PATCH"}
	paths := []string{
		"/api/users", "/api/products", "/api/orders", "/health",
		"/metrics", "/api/auth/login", "/api/auth/logout",
	}
	services := []string{"backend-api", "auth-service", "product-service", "order-service"}
	routers := []string{"api-router", "web-router", "admin-router", "public-router"}
	
	logs := make([]TraefikLog, count)
	for i := 0; i < count; i++ {
		status := 200
		r := rand.Float64()
		if r < 0.05 {
			status = 500 + rand.Intn(10)
		} else if r < 0.10 {
			status = 400 + rand.Intn(10)
		} else if r < 0.15 {
			status = 300 + rand.Intn(10)
		}
		
		duration := int64(rand.Intn(500)) * 1e6 // 0-500ms in nanoseconds
		
		logs[i] = TraefikLog{
			ClientAddr:       fmt.Sprintf("192.168.1.%d:5432%d", rand.Intn(255), rand.Intn(10)),
			ClientHost:       fmt.Sprintf("192.168.1.%d", rand.Intn(255)),
			ClientPort:       fmt.Sprintf("5432%d", rand.Intn(10)),
			DownstreamStatus: status,
			Duration:         duration,
			RequestMethod:    methods[rand.Intn(len(methods))],
			RequestPath:      paths[rand.Intn(len(paths))],
			ServiceName:      services[rand.Intn(len(services))],
			RouterName:       routers[rand.Intn(len(routers))],
			StartUTC:         time.Now().Add(-time.Duration(rand.Intn(3600)) * time.Second).Format(time.RFC3339),
		}
	}
	
	return logs
}

// Helper functions

func average(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

func percentile(values []float64, p float64) float64 {
	if len(values) == 0 {
		return 0
	}
	
	// Sort values
	sorted := make([]float64, len(values))
	copy(sorted, values)
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i] > sorted[j] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	
	index := int(float64(len(sorted)-1) * p / 100.0)
	return sorted[index]
}

func sortRoutes(routes []RouteMetric) {
	for i := 0; i < len(routes); i++ {
		for j := i + 1; j < len(routes); j++ {
			if routes[i].Count < routes[j].Count {
				routes[i], routes[j] = routes[j], routes[i]
			}
		}
	}
}

func sortServices(services []ServiceMetric) {
	for i := 0; i < len(services); i++ {
		for j := i + 1; j < len(services); j++ {
			if services[i].Count < services[j].Count {
				services[i], services[j] = services[j], services[i]
			}
		}
	}
}

func sortRouters(routers []RouterMetric) {
	for i := 0; i < len(routers); i++ {
		for j := i + 1; j < len(routers); j++ {
			if routers[i].Count < routers[j].Count {
				routers[i], routers[j] = routers[j], routers[i]
			}
		}
	}
}