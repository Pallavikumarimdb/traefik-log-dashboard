package routes

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/config"
	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/utils"
	"github.com/hhftechnology/traefik-log-dashboard/agent/pkg/logs"
	"github.com/hhftechnology/traefik-log-dashboard/agent/pkg/system"
)

// Handler manages HTTP routes and dependencies
type Handler struct {
	config *config.Config
}

// NewHandler creates a new Handler with the given configuration
func NewHandler(cfg *config.Config) *Handler {
	return &Handler{
		config: cfg,
	}
}

// HandleAccessLogs handles requests for access logs
func (h *Handler) HandleAccessLogs(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	position := utils.GetQueryParamInt64(r, "position", 0)
	lines := utils.GetQueryParamInt(r, "lines", 100)

	result, err := logs.GetLogs(h.config.AccessPath, position, lines)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, result)
}

// HandleErrorLogs handles requests for error logs
func (h *Handler) HandleErrorLogs(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	position := utils.GetQueryParamInt64(r, "position", 0)
	lines := utils.GetQueryParamInt(r, "lines", 100)

	result, err := logs.GetLogs(h.config.ErrorPath, position, lines)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, result)
}

// HandleSystemLogs handles requests for system logs listing
func (h *Handler) HandleSystemLogs(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	logSizes, err := logs.GetLogSizes(h.config.AccessPath)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, logSizes)
}

// HandleSystemResources handles requests for system resource statistics
func (h *Handler) HandleSystemResources(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if !h.config.SystemMonitoring {
		utils.RespondError(w, http.StatusForbidden, "System monitoring is disabled")
		return
	}

	stats, err := system.GetSystemStats()
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, stats)
}

// HandleStatus handles health check requests
func (h *Handler) HandleStatus(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Check if access log path exists
	accessPathExists := false
	if info, err := os.Stat(h.config.AccessPath); err == nil {
		accessPathExists = true
		if info.IsDir() {
			// Check if directory contains any log files
			entries, err := os.ReadDir(h.config.AccessPath)
			if err == nil && len(entries) > 0 {
				accessPathExists = true
			}
		}
	}

	// Check if error log path exists
	errorPathExists := false
	if info, err := os.Stat(h.config.ErrorPath); err == nil {
		errorPathExists = true
		if info.IsDir() {
			entries, err := os.ReadDir(h.config.ErrorPath)
			if err == nil && len(entries) > 0 {
				errorPathExists = true
			}
		}
	}

	status := map[string]interface{}{
		"status":             "ok",
		"access_path":        h.config.AccessPath,
		"access_path_exists": accessPathExists,
		"error_path":         h.config.ErrorPath,
		"error_path_exists":  errorPathExists,
		"system_monitoring":  h.config.SystemMonitoring,
		"monitor_interval":   h.config.MonitorInterval,
		"auth_enabled":       h.config.AuthToken != "",
	}

	// Add access log info if it exists
	if accessPathExists {
		if info, err := os.Stat(h.config.AccessPath); err == nil {
			if info.IsDir() {
				status["access_type"] = "directory"
			} else {
				status["access_type"] = "file"
				status["access_size"] = info.Size()
			}
		}
	}

	// Add error log info if it exists
	if errorPathExists {
		if info, err := os.Stat(h.config.ErrorPath); err == nil {
			if info.IsDir() {
				status["error_type"] = "directory"
			} else {
				status["error_type"] = "file"
				status["error_size"] = info.Size()
			}
		}
	}

	utils.RespondJSON(w, http.StatusOK, status)
}

// HandleGetLog handles requests for a specific log file
func (h *Handler) HandleGetLog(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	filename := utils.GetQueryParam(r, "filename", "")
	if filename == "" {
		utils.RespondError(w, http.StatusBadRequest, "filename parameter is required")
		return
	}

	position := utils.GetQueryParamInt64(r, "position", 0)
	lines := utils.GetQueryParamInt(r, "lines", 100)

	// Construct full path
	fullPath := filepath.Join(h.config.AccessPath, filename)

	result, err := logs.GetLogs(fullPath, position, lines)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, result)
}