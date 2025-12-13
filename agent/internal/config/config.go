package config

import (
	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/env"
)

// Config holds the application configuration
// REFACTOR: Removed GeoIP fields - Dashboard handles GeoIP locally
type Config struct {
	AccessPath       string
	ErrorPath        string
	AuthToken        string
	SystemMonitoring bool
	MonitorInterval  int
	Port             string
	LogFormat        string
	PositionFile     string
}

// Load reads configuration from environment variables using the env package
func Load() *Config {
	e := env.LoadEnv()

	cfg := &Config{
		AccessPath:       e.AccessPath,
		ErrorPath:        e.ErrorPath,
		AuthToken:        e.AuthToken,
		SystemMonitoring: e.SystemMonitoring,
		MonitorInterval:  2000, // Keep default for now
		Port:             e.Port,
		LogFormat:        e.LogFormat,
		PositionFile:     e.PositionFile,
	}

	return cfg
}