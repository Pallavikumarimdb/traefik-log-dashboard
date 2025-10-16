package traefik

import (
	"encoding/json"
	"regexp"
	"strconv"
	"strings"

	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/logs"
)

// CLF pattern for Traefik logs
var clfPattern = regexp.MustCompile(`^(\S+) - (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)" (\d+) "([^"]*)" "([^"]*)" (\d+)ms`)

// ParseLog parses a single Traefik log line (auto-detect JSON or CLF format)
func ParseLog(logLine string) (*logs.TraefikLog, error) {
	if logLine == "" {
		return nil, nil
	}

	// Try JSON first
	if strings.HasPrefix(strings.TrimSpace(logLine), "{") {
		return parseJSONLog(logLine)
	}

	// Try CLF format
	return parseCLFLog(logLine)
}

// parseJSONLog parses JSON format Traefik log
func parseJSONLog(logLine string) (*logs.TraefikLog, error) {
	var log logs.TraefikLog
	if err := json.Unmarshal([]byte(logLine), &log); err != nil {
		return nil, err
	}
	return &log, nil
}

// parseCLFLog parses CLF (Common Log Format) Traefik log
func parseCLFLog(logLine string) (*logs.TraefikLog, error) {
	matches := clfPattern.FindStringSubmatch(logLine)
	if matches == nil {
		return nil, nil
	}

	remoteAddr := matches[1]
	username := matches[2]
	timestamp := matches[3]
	method := matches[4]
	path := matches[5]
	protocol := matches[6]
	status, _ := strconv.Atoi(matches[7])
	size, _ := strconv.Atoi(matches[8])
	referer := matches[9]
	userAgent := matches[10]
	count, _ := strconv.Atoi(matches[11])
	router := matches[12]
	serviceURL := matches[13]
	duration, _ := strconv.Atoi(matches[14])

	// Extract host and port from remote address
	clientHost := remoteAddr
	clientPort := ""
	if idx := strings.LastIndex(remoteAddr, ":"); idx != -1 {
		clientHost = remoteAddr[:idx]
		clientPort = remoteAddr[idx+1:]
	}

	if username == "-" {
		username = ""
	}
	if referer == "-" {
		referer = ""
	}
	if userAgent == "-" {
		userAgent = ""
	}

	return &logs.TraefikLog{
		ClientAddr:            remoteAddr,
		ClientHost:            clientHost,
		ClientPort:            clientPort,
		ClientUsername:        username,
		DownstreamContentSize: size,
		DownstreamStatus:      status,
		Duration:              int64(duration) * 1000000, // Convert ms to ns
		OriginContentSize:     0,
		OriginDuration:        0,
		OriginStatus:          status,
		Overhead:              0,
		RequestAddr:           remoteAddr,
		RequestContentSize:    0,
		RequestCount:          count,
		RequestHost:           "",
		RequestMethod:         method,
		RequestPath:           path,
		RequestPort:           "",
		RequestProtocol:       protocol,
		RequestScheme:         "http",
		RetryAttempts:         0,
		RouterName:            router,
		ServiceAddr:           "",
		ServiceName:           "",
		ServiceURL:            serviceURL,
		StartLocal:            timestamp,
		StartUTC:              timestamp,
		EntryPointName:        "",
		RequestReferer:        referer,
		RequestUserAgent:      userAgent,
	}, nil
}