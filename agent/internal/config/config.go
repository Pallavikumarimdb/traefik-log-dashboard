package config

import (
	"os"
	"strconv"
)

// Config holds the application configuration
type Config struct {
	AccessPath       string
	ErrorPath        string
	AuthToken        string
	SystemMonitoring bool
	MonitorInterval  int
	Port             string
}

// Load reads configuration from environment variables
func Load() *Config {
	cfg := &Config{
		AccessPath:       getEnv("TRAEFIK_LOG_DASHBOARD_ACCESS_PATH", "/var/log/traefik/access.log"),
		ErrorPath:        getEnv("TRAEFIK_LOG_DASHBOARD_ERROR_PATH", "/var/log/traefik/traefik.log"),
		AuthToken:        getEnv("TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN", ""),
		SystemMonitoring: getEnvBool("TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING", true),
		MonitorInterval:  getEnvInt("TRAEFIK_LOG_DASHBOARD_MONITOR_INTERVAL", 2000),
		Port:             getEnv("PORT", "5000"),
	}

	return cfg
}

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvBool retrieves a boolean environment variable or returns a default value
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		boolValue, err := strconv.ParseBool(value)
		if err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// getEnvInt retrieves an integer environment variable or returns a default value
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		intValue, err := strconv.Atoi(value)
		if err == nil {
			return intValue
		}
	}
	return defaultValue
}