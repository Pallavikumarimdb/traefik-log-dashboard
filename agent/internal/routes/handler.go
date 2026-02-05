package routes

import (
	"sync/atomic"

	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/config"
	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/state"
)

// Handler manages HTTP routes and dependencies
type Handler struct {
	config        *config.Config
	state         *state.StateManager
	streamClients atomic.Int32
}

// NewHandler creates a new Handler with the given configuration
func NewHandler(cfg *config.Config, sm *state.StateManager) *Handler {
	return &Handler{
		config: cfg,
		state:  sm,
	}
}
