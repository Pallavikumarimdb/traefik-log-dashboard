package traefik

import (
	"regexp"
	"strings"
)

// ErrorLog represents a parsed error log entry
type ErrorLog struct {
	Timestamp string
	Level     string
	Message   string
}

// Error log pattern for Traefik
var errorPattern = regexp.MustCompile(`^(\S+)\s+(\S+)\s+(.+)$`)

// ParseErrorLog parses a Traefik error log line
func ParseErrorLog(logLine string) (*ErrorLog, error) {
	if logLine == "" {
		return nil, nil
	}

	// Try to extract timestamp, level, and message
	matches := errorPattern.FindStringSubmatch(logLine)
	if matches == nil {
		// Return as-is if pattern doesn't match
		return &ErrorLog{
			Timestamp: "",
			Level:     "unknown",
			Message:   logLine,
		}, nil
	}

	timestamp := matches[1]
	level := strings.ToLower(matches[2])
	message := matches[3]

	return &ErrorLog{
		Timestamp: timestamp,
		Level:     level,
		Message:   message,
	}, nil
}

// GetLogLevel returns the severity level of the error
func (e *ErrorLog) GetLogLevel() string {
	level := strings.ToLower(e.Level)
	
	if strings.Contains(level, "error") {
		return "error"
	} else if strings.Contains(level, "warn") {
		return "warning"
	} else if strings.Contains(level, "info") {
		return "info"
	} else if strings.Contains(level, "debug") {
		return "debug"
	}
	
	return "unknown"
}