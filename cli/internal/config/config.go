package config

import (
	"fmt"
	"strconv"
	"time"

	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/env"
)

// Config holds the application configuration
type Config struct {
	// Agent configuration
	AgentURL      string
	AuthToken     string
	
	// Log paths
	AccessLogPath string
	ErrorLogPath  string
	
	// Display settings
	RefreshInterval time.Duration
	MaxLogs         int
	
	// Feature flags
	DemoMode          bool
	SystemMonitoring  bool
}

// Load creates a new Config with values from environment or defaults
func Load() (*Config, error) {
	cfg := &Config{
		AgentURL:         env.GetEnv("AGENT_URL", "http://localhost:5000"),
		AuthToken:        env.GetEnv("AGENT_TOKEN", ""),
		AccessLogPath:    env.GetEnv("ACCESS_LOG_PATH", "/var/log/traefik/access.log"),
		ErrorLogPath:     env.GetEnv("ERROR_LOG_PATH", "/var/log/traefik/traefik.log"),
		RefreshInterval:  parseDuration(env.GetEnv("REFRESH_INTERVAL", "2s")),
		MaxLogs:          parseInt(env.GetEnv("MAX_LOGS", "1000")),
		DemoMode:         parseBool(env.GetEnv("DEMO_MODE", "false")),
		SystemMonitoring: parseBool(env.GetEnv("SYSTEM_MONITORING", "true")),
	}

	return cfg, cfg.Validate()
}

// Validate checks if the configuration is valid
func (c *Config) Validate() error {
	if c.AgentURL == "" {
		return fmt.Errorf("agent URL cannot be empty")
	}

	if c.RefreshInterval < time.Second {
		return fmt.Errorf("refresh interval must be at least 1 second")
	}

	if c.MaxLogs < 1 {
		return fmt.Errorf("max logs must be at least 1")
	}

	return nil
}

// parseDuration parses a duration string, returns 2s if invalid
func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 2 * time.Second
	}
	return d
}

// parseInt parses an int string, returns default if invalid
func parseInt(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		return 1000
	}
	return i
}

// parseBool parses a bool string
func parseBool(s string) bool {
	b, _ := strconv.ParseBool(s)
	return b
}