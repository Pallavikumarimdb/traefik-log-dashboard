package logs

import (
	"fmt"
	"math/rand"
	"time"
)

var (
	methods      = []string{"GET", "POST", "PUT", "DELETE", "PATCH"}
	paths        = []string{"/api/users", "/api/products", "/api/orders", "/api/auth/login", "/api/auth/logout", "/api/dashboard", "/api/settings", "/health", "/metrics", "/api/payments"}
	routers      = []string{"api-router", "web-router", "admin-router", "public-router", "internal-router"}
	services     = []string{"backend-service", "api-service", "auth-service", "payment-service", "notification-service"}
	serviceURLs  = []string{"http://backend:8080", "http://api:3000", "http://auth:4000", "http://payment:5000", "http://notification:6000"}
	entryPoints  = []string{"web", "websecure", "admin", "metrics"}
	ipPrefixes   = []string{"8.8.8", "192.168.1", "10.0.0", "172.16.0", "66.249.64", "80.12.34", "82.45.67", "103.21.244", "106.12.34", "200.123.45"}
)

// GenerateDemoLogs generates demo Traefik logs for testing
func GenerateDemoLogs(count int) []TraefikLog {
	logs := make([]TraefikLog, count)
	
	for i := 0; i < count; i++ {
		logs[i] = generateDemoLog()
	}
	
	return logs
}

// generateDemoLog generates a single demo log entry
func generateDemoLog() TraefikLog {
	ip := randomIP()
	port := fmt.Sprintf("%d", 1024+rand.Intn(60000))
	method := methods[rand.Intn(len(methods))]
	path := paths[rand.Intn(len(paths))]
	status := randomStatus()
	duration := randomDuration()
	originDuration := int64(float64(duration) * 0.8)
	overhead := duration - originDuration
	size := rand.Intn(10000)
	router := routers[rand.Intn(len(routers))]
	service := services[rand.Intn(len(services))]
	serviceURL := serviceURLs[rand.Intn(len(serviceURLs))]
	entryPoint := entryPoints[rand.Intn(len(entryPoints))]
	timestamp := randomTimestamp(60)

	return TraefikLog{
		ClientAddr:            fmt.Sprintf("%s:%s", ip, port),
		ClientHost:            ip,
		ClientPort:            port,
		ClientUsername:        "",
		DownstreamContentSize: size,
		DownstreamStatus:      status,
		Duration:              duration,
		OriginContentSize:     size,
		OriginDuration:        originDuration,
		OriginStatus:          status,
		Overhead:              overhead,
		RequestAddr:           fmt.Sprintf("%s:%s", ip, port),
		RequestContentSize:    0,
		RequestCount:          rand.Intn(10) + 1,
		RequestHost:           "example.com",
		RequestMethod:         method,
		RequestPath:           path,
		RequestPort:           "443",
		RequestProtocol:       "HTTP/1.1",
		RequestScheme:         "https",
		RetryAttempts:         0,
		RouterName:            router,
		ServiceAddr:           serviceURL,
		ServiceName:           service,
		ServiceURL:            serviceURL,
		StartLocal:            timestamp,
		StartUTC:              timestamp,
		EntryPointName:        entryPoint,
		RequestReferer:        "",
		RequestUserAgent:      "Mozilla/5.0",
	}
}

// randomIP generates a random IP address
func randomIP() string {
	prefix := ipPrefixes[rand.Intn(len(ipPrefixes))]
	suffix := rand.Intn(255)
	return fmt.Sprintf("%s.%d", prefix, suffix)
}

// randomStatus generates a random status code with realistic distribution
func randomStatus() int {
	r := rand.Float64()
	if r < 0.7 {
		return 200 // 70% success
	} else if r < 0.85 {
		return 201 // 15% created
	} else if r < 0.90 {
		return 304 // 5% not modified
	} else if r < 0.95 {
		return 404 // 5% not found
	} else if r < 0.98 {
		return 400 // 3% bad request
	}
	return 500 // 2% server error
}

// randomDuration generates a random duration with realistic distribution (in nanoseconds)
func randomDuration() int64 {
	r := rand.Float64()
	if r < 0.5 {
		return int64(rand.Intn(50000000)) // 0-50ms (50%)
	} else if r < 0.8 {
		return int64(rand.Intn(150000000) + 50000000) // 50-200ms (30%)
	} else if r < 0.95 {
		return int64(rand.Intn(300000000) + 200000000) // 200-500ms (15%)
	}
	return int64(rand.Intn(2000000000) + 500000000) // 500ms-2s (5%)
}

// randomTimestamp generates a random timestamp within the last N minutes
func randomTimestamp(minutesAgo int) string {
	now := time.Now()
	past := now.Add(-time.Duration(minutesAgo) * time.Minute)
	randomTime := past.Add(time.Duration(rand.Int63n(int64(time.Duration(minutesAgo) * time.Minute))))
	return randomTime.Format(time.RFC3339)
}

// ParseTraefikLog is a wrapper that calls the traefik package parser
func ParseTraefikLog(logLine string) (*TraefikLog, error) {
	// This will be imported from traefik package
	// For now, return a stub
	return nil, fmt.Errorf("not implemented - use traefik.ParseLog")
}