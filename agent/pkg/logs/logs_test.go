package logs

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func writeTempLog(t *testing.T, lines []string) (string, func()) {
	t.Helper()
	dir := t.TempDir()
	fp := filepath.Join(dir, "access.log")
	content := ""
	for _, l := range lines {
		content += l + "\n"
	}
	if err := os.WriteFile(fp, []byte(content), 0644); err != nil {
		t.Fatalf("write file: %v", err)
	}
	return fp, func() { os.Remove(fp) }
}

func TestStreamFromPositionReadsNewLines(t *testing.T) {
	fp, cleanup := writeTempLog(t, []string{"a", "b", "c"})
	defer cleanup()

	ctx := context.Background()
	lines, pos, err := StreamFromPosition(ctx, fp, 0, 10, 1024)
	if err != nil {
		t.Fatalf("stream error: %v", err)
	}
	if len(lines) != 3 {
		t.Fatalf("expected 3 lines, got %d", len(lines))
	}
	if pos == 0 {
		t.Fatalf("position did not advance")
	}

	// Append new lines and read from last position
	f, _ := os.OpenFile(fp, os.O_APPEND|os.O_WRONLY, 0644)
	f.WriteString("d\n")
	f.WriteString("e\n")
	f.Close()

	lines2, pos2, err := StreamFromPosition(ctx, fp, pos, 10, 1024)
	if err != nil {
		t.Fatalf("stream error 2: %v", err)
	}
	if len(lines2) != 2 {
		t.Fatalf("expected 2 new lines, got %d", len(lines2))
	}
	if pos2 <= pos {
		t.Fatalf("position did not move forward")
	}
}

func TestStreamFromPositionMaxBytes(t *testing.T) {
	fp, cleanup := writeTempLog(t, []string{"short", "short", "averyverylongline"})
	defer cleanup()

	ctx := context.Background()
	lines, _, err := StreamFromPosition(ctx, fp, 0, 10, 12) // only a few bytes
	if err != nil {
		t.Fatalf("stream error: %v", err)
	}
	if len(lines) == 0 {
		t.Fatalf("expected at least one line under byte cap")
	}
}

func BenchmarkParseTraefikLogs(b *testing.B) {
	lines := []string{
		`{"ClientAddr":"1.1.1.1:1234","RequestMethod":"GET","RequestPath":"/","RequestHost":"example.com","StartUTC":"2024-01-01T00:00:00Z","DownstreamStatus":200,"RequestCount":1}`,
		`{"ClientAddr":"2.2.2.2:1234","RequestMethod":"POST","RequestPath":"/login","RequestHost":"example.com","StartUTC":"2024-01-01T00:00:01Z","DownstreamStatus":302,"RequestCount":1}`,
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = ParseTraefikLogs(lines)
	}
}

func BenchmarkStreamFromPosition(b *testing.B) {
	// Prepare a file with many lines
	lines := make([]string, 0, 1000)
	for i := 0; i < 1000; i++ {
		lines = append(lines, "line")
	}
	fp, cleanup := writeTempLog(&testing.T{}, lines)
	defer cleanup()

	ctx := context.Background()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, err := StreamFromPosition(ctx, fp, 0, 400, 512*1024)
		if err != nil {
			b.Fatalf("stream error: %v", err)
		}
	}
}
