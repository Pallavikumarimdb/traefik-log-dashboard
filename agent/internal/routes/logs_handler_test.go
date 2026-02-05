package routes

import (
	"context"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/config"
	"github.com/hhftechnology/traefik-log-dashboard/agent/internal/state"
)

func TestHandleStreamAccessLogs(t *testing.T) {
	dir := t.TempDir()
	logPath := filepath.Join(dir, "access.log")
	if err := os.WriteFile(logPath, []byte("first\nsecond\n"), 0644); err != nil {
		t.Fatalf("write log: %v", err)
	}

	cfg := &config.Config{
		AccessPath:            logPath,
		StreamBatchLines:      10,
		StreamFlushIntervalMS: 10,
		StreamMaxClients:      5,
		StreamMaxDurationSec:  1,
		StreamMaxBytesPerBatch: 1024,
	}

	st := state.NewStateManager(cfg)
	h := NewHandler(cfg, st)

	req := httptest.NewRequest("GET", "/api/logs/stream", nil)
	// Cancel after a short time to end the loop
	cancelTime, cancel := context.WithTimeout(req.Context(), 50*time.Millisecond)
	defer cancel()
	req = req.WithContext(cancelTime)

	rr := httptest.NewRecorder()
	h.HandleStreamAccessLogs(rr, req)

	body := rr.Body.String()
	if !strings.Contains(body, "data: first") {
		t.Fatalf("expected stream to contain first line, got: %s", body)
	}
}
