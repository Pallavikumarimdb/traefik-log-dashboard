package logs

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// TraefikLog represents a single Traefik access log entry
type TraefikLog struct {
	ClientAddr            string  `json:"ClientAddr"`
	ClientHost            string  `json:"ClientHost"`
	ClientPort            string  `json:"ClientPort"`
	ClientUsername        string  `json:"ClientUsername"`
	DownstreamContentSize int     `json:"DownstreamContentSize"`
	DownstreamStatus      int     `json:"DownstreamStatus"`
	Duration              int64   `json:"Duration"`
	OriginContentSize     int     `json:"OriginContentSize"`
	OriginDuration        int64   `json:"OriginDuration"`
	OriginStatus          int     `json:"OriginStatus"`
	Overhead              int64   `json:"Overhead"`
	RequestAddr           string  `json:"RequestAddr"`
	RequestContentSize    int     `json:"RequestContentSize"`
	RequestCount          int     `json:"RequestCount"`
	RequestHost           string  `json:"RequestHost"`
	RequestMethod         string  `json:"RequestMethod"`
	RequestPath           string  `json:"RequestPath"`
	RequestPort           string  `json:"RequestPort"`
	RequestProtocol       string  `json:"RequestProtocol"`
	RequestScheme         string  `json:"RequestScheme"`
	RetryAttempts         int     `json:"RetryAttempts"`
	RouterName            string  `json:"RouterName"`
	ServiceAddr           string  `json:"ServiceAddr"`
	ServiceName           string  `json:"ServiceName"`
	ServiceURL            string  `json:"ServiceURL"`
	StartLocal            string  `json:"StartLocal"`
	StartUTC              string  `json:"StartUTC"`
	EntryPointName        string  `json:"entryPointName"`
	RequestReferer        string  `json:"request_Referer"`
	RequestUserAgent      string  `json:"request_User_Agent"`
}

// SystemStats represents system resource statistics
type SystemStats struct {
	CPU    CPUStats    `json:"cpu"`
	Memory MemoryStats `json:"memory"`
	Disk   DiskStats   `json:"disk"`
}

// CPUStats represents CPU usage statistics
type CPUStats struct {
	UsagePercent float64 `json:"usagePercent"`
	Cores        int     `json:"cores"`
}

// MemoryStats represents memory usage statistics
type MemoryStats struct {
	Total       uint64  `json:"total"`
	Available   uint64  `json:"available"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
	Free        uint64  `json:"free"`
}

// DiskStats represents disk usage statistics
type DiskStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"usedPercent"`
}

// FetchAccessLogs fetches access logs from the agent
func FetchAccessLogs(agentURL, authToken string, maxLogs int) ([]TraefikLog, error) {
	url := fmt.Sprintf("%s/api/logs/access?lines=%d", agentURL, maxLogs)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	if authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", authToken))
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("agent returned status %d: %s", resp.StatusCode, body)
	}
	
	var result struct {
		Logs []string `json:"logs"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	
	// Parse log lines
	var logs []TraefikLog
	for _, line := range result.Logs {
		if line == "" {
			continue
		}
		
		var log TraefikLog
		if err := json.Unmarshal([]byte(line), &log); err == nil {
			logs = append(logs, log)
		}
	}
	
	return logs, nil
}

// FetchErrorLogs fetches error logs from the agent
func FetchErrorLogs(agentURL, authToken string, maxLogs int) ([]string, error) {
	url := fmt.Sprintf("%s/api/logs/error?lines=%d", agentURL, maxLogs)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	if authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", authToken))
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("agent returned status %d: %s", resp.StatusCode, body)
	}
	
	var result struct {
		Logs []string `json:"logs"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	
	return result.Logs, nil
}

// FetchSystemStats fetches system statistics from the agent
func FetchSystemStats(agentURL, authToken string) (*SystemStats, error) {
	url := fmt.Sprintf("%s/api/system/resources", agentURL)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	if authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", authToken))
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("agent returned status %d: %s", resp.StatusCode, body)
	}
	
	var stats SystemStats
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, err
	}
	
	return &stats, nil
}