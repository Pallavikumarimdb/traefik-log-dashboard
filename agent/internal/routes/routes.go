package routes

import (
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"encoding/json"

	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/config"
	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/utils"
	"github.com/hhftechnology/traefik-log-dashboard/agent/pkg/logs"
	"github.com/hhftechnology/traefik-log-dashboard/agent/pkg/system"
	"github.com/hhftechnology/traefik-log-dashboard/agent/pkg/location"
	"github.com/hhftechnology/traefik-log-dashboard/agent/pkg/logger" 
)

// Handler manages HTTP routes and dependencies
type Handler struct {
	config *config.Config
	// Track file positions for incremental reading
	positions     map[string]int64
	positionMutex sync.RWMutex
}

// NewHandler creates a new Handler with the given configuration
func NewHandler(cfg *config.Config) *Handler {
	h := &Handler{
		config:    cfg,
		positions: make(map[string]int64),
	}
	
	// ADDED: Load positions from file on startup
	if err := h.loadPositions(); err != nil {
		logger.Log.Printf("Warning: Could not load positions from file: %v", err)
	}
	
	return h
}

// ADDED: loadPositions loads position data from the position file
func (h *Handler) loadPositions() error {
	if h.config.PositionFile == "" {
		return nil
	}

	// Check if file exists
	if _, err := os.Stat(h.config.PositionFile); os.IsNotExist(err) {
		logger.Log.Printf("Position file does not exist yet: %s", h.config.PositionFile)
		return nil
	}

	// Read file
	data, err := os.ReadFile(h.config.PositionFile)
	if err != nil {
		return err
	}

	// Parse JSON
	var positions map[string]int64
	if err := json.Unmarshal(data, &positions); err != nil {
		return err
	}

	h.positionMutex.Lock()
	h.positions = positions
	h.positionMutex.Unlock()

	logger.Log.Printf("Loaded %d position(s) from %s", len(positions), h.config.PositionFile)
	return nil
}

// ADDED: savePositions persists position data to the position file
func (h *Handler) savePositions() error {
	if h.config.PositionFile == "" {
		return nil
	}

	h.positionMutex.RLock()
	positions := make(map[string]int64, len(h.positions))
	for k, v := range h.positions {
		positions[k] = v
	}
	h.positionMutex.RUnlock()

	// Marshal to JSON
	data, err := json.MarshalIndent(positions, "", "  ")
	if err != nil {
		return err
	}

	// Ensure directory exists
	dir := filepath.Dir(h.config.PositionFile)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Write to file atomically (write to temp file, then rename)
	tmpFile := h.config.PositionFile + ".tmp"
	if err := os.WriteFile(tmpFile, data, 0644); err != nil {
		return err
	}

	if err := os.Rename(tmpFile, h.config.PositionFile); err != nil {
		os.Remove(tmpFile) // Clean up temp file on error
		return err
	}

	return nil
}

// getFilePosition gets the tracked position for a file
func (h *Handler) getFilePosition(path string) int64 {
	h.positionMutex.RLock()
	defer h.positionMutex.RUnlock()
	if pos, exists := h.positions[path]; exists {
		return pos
	}
	return -1 // Return -1 to indicate first read (tail mode)
}

// setFilePosition updates the tracked position for a file
func (h *Handler) setFilePosition(path string, position int64) {
	h.positionMutex.Lock()
	h.positions[path] = position
	h.positionMutex.Unlock()
	
	// ADDED: Save to disk asynchronously to avoid blocking
	go func() {
		if err := h.savePositions(); err != nil {
			logger.Log.Printf("Error saving positions to file: %v", err)
		}
	}()
}

// HandleAccessLogs handles requests for access logs
func (h *Handler) HandleAccessLogs(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Get query parameters
	position := utils.GetQueryParamInt64(r, "position", -2) // -2 means use tracked position
	lines := utils.GetQueryParamInt(r, "lines", 1000)
	tail := utils.GetQueryParamBool(r, "tail", false)

	// Check if path exists
	fileInfo, err := os.Stat(h.config.AccessPath)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var result logs.LogResult

	if fileInfo.IsDir() {
		// For directories, get logs from all files
		if tail || position == -2 {
			// First request or tail mode - get last N lines
			positions := []logs.Position{}
			result, err = logs.GetLogs(h.config.AccessPath, positions, false, false)
		} else {
			// Use provided position
			positions := []logs.Position{{Position: position}}
			result, err = logs.GetLogs(h.config.AccessPath, positions, false, false)
		}
	} else {
		// Single file
		trackedPos := h.getFilePosition(h.config.AccessPath)
		
		// Determine position to use
		var usePosition int64
		if position == -2 {
			// Use tracked position
			usePosition = trackedPos
		} else if position == -1 || tail {
			// Tail mode requested
			usePosition = -1
		} else {
			// Use provided position
			usePosition = position
		}

		positions := []logs.Position{{Position: usePosition}}
		result, err = logs.GetLogs(h.config.AccessPath, positions, false, false)

		// Update tracked position if we got results
		if err == nil && len(result.Positions) > 0 {
			h.setFilePosition(h.config.AccessPath, result.Positions[0].Position)
		}
	}

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Limit the number of logs returned
	if len(result.Logs) > lines {
		// Keep only the most recent logs
		startIdx := len(result.Logs) - lines
		result.Logs = result.Logs[startIdx:]
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

	position := utils.GetQueryParamInt64(r, "position", -2)
	lines := utils.GetQueryParamInt(r, "lines", 100)
	tail := utils.GetQueryParamBool(r, "tail", false)

	fileInfo, err := os.Stat(h.config.ErrorPath)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var result logs.LogResult

	if fileInfo.IsDir() {
		if tail || position == -2 {
			positions := []logs.Position{}
			result, err = logs.GetLogs(h.config.ErrorPath, positions, true, false)
		} else {
			positions := []logs.Position{{Position: position}}
			result, err = logs.GetLogs(h.config.ErrorPath, positions, true, false)
		}
	} else {
		trackedPos := h.getFilePosition(h.config.ErrorPath)
		
		var usePosition int64
		if position == -2 {
			usePosition = trackedPos
		} else if position == -1 || tail {
			usePosition = -1
		} else {
			usePosition = position
		}

		positions := []logs.Position{{Position: usePosition}}
		result, err = logs.GetLogs(h.config.ErrorPath, positions, true, false)

		if err == nil && len(result.Positions) > 0 {
			h.setFilePosition(h.config.ErrorPath, result.Positions[0].Position)
		}
	}

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if len(result.Logs) > lines {
		startIdx := len(result.Logs) - lines
		result.Logs = result.Logs[startIdx:]
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

	stats, err := system.MeasureSystem()
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

	accessPathExists := false
	if info, err := os.Stat(h.config.AccessPath); err == nil {
		accessPathExists = true
		if info.IsDir() {
			entries, _ := os.ReadDir(h.config.AccessPath)
			if len(entries) == 0 {
				accessPathExists = false
			}
		}
	}

	errorPathExists := false
	if info, err := os.Stat(h.config.ErrorPath); err == nil {
		errorPathExists = true
		if info.IsDir() {
			entries, _ := os.ReadDir(h.config.ErrorPath)
			if len(entries) == 0 {
				errorPathExists = false
			}
		}
	}

	status := map[string]interface{}{
		"status":              "ok",
		"access_path":         h.config.AccessPath,
		"access_path_exists":  accessPathExists,
		"error_path":          h.config.ErrorPath,
		"error_path_exists":   errorPathExists,
		"system_monitoring":   h.config.SystemMonitoring,
		"auth_enabled":        h.config.AuthToken != "",
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

	fullPath := filepath.Join(h.config.AccessPath, filename)

	positions := []logs.Position{{Position: position, Filename: filename}}
	result, err := logs.GetLogs(fullPath, positions, false, false)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if len(result.Logs) > lines {
		result.Logs = result.Logs[:lines]
	}

	utils.RespondJSON(w, http.StatusOK, result)
}

// HandleLocationLookup handles requests for IP geolocation lookups
func (h *Handler) HandleLocationLookup(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Only allow POST requests for location lookups
	if r.Method != http.MethodPost {
		utils.RespondError(w, http.StatusMethodNotAllowed, "Only POST method is allowed")
		return
	}

	// Check if GeoIP is enabled
	if !h.config.GeoIPEnabled {
		utils.RespondError(w, http.StatusForbidden, "GeoIP lookups are disabled")
		return
	}

	// Check if location services are available
	if !location.LocationsEnabled() {
		utils.RespondError(w, http.StatusServiceUnavailable, "GeoIP databases not available")
		return
	}

	// Parse request body - expecting array of IP addresses
	var request struct {
		IPs []string `json:"ips"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if len(request.IPs) == 0 {
		utils.RespondError(w, http.StatusBadRequest, "No IP addresses provided")
		return
	}

	// Limit to 1000 IPs per request to prevent abuse
	if len(request.IPs) > 1000 {
		utils.RespondError(w, http.StatusBadRequest, "Too many IP addresses (max 1000)")
		return
	}

	// Perform location lookups
	locations, err := location.ResolveLocations(request.IPs)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Return results
	response := map[string]interface{}{
		"locations": locations,
		"count":     len(locations),
	}

	utils.RespondJSON(w, http.StatusOK, response)
}

// HandleLocationStatus returns the status of the GeoIP service
func (h *Handler) HandleLocationStatus(w http.ResponseWriter, r *http.Request) {
	utils.EnableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	status := map[string]interface{}{
		"enabled":   h.config.GeoIPEnabled,
		"available": location.LocationsEnabled(),
		"city_db":   h.config.GeoIPCityDB,
		"country_db": h.config.GeoIPCountryDB,
	}

	utils.RespondJSON(w, http.StatusOK, status)
}