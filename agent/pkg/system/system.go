package system

import (
	"fmt"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

// SystemStats represents overall system resource statistics
type SystemStats struct {
	CPU    CPUStats    `json:"cpu"`
	Memory MemoryStats `json:"memory"`
	Disk   DiskStats   `json:"disk"`
}

// CPUStats represents CPU usage statistics
type CPUStats struct {
	UsagePercent float64 `json:"usage_percent"`
	Cores        int     `json:"cores"`
}

// MemoryStats represents memory usage statistics
type MemoryStats struct {
	Total       uint64  `json:"total"`
	Available   uint64  `json:"available"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"used_percent"`
	Free        uint64  `json:"free"`
}

// DiskStats represents disk usage statistics
type DiskStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"used_percent"`
}

// GetSystemStats retrieves current system resource statistics
func GetSystemStats() (*SystemStats, error) {
	cpuStats, err := getCPUStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU stats: %w", err)
	}

	memStats, err := getMemoryStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get memory stats: %w", err)
	}

	diskStats, err := getDiskStats("/")
	if err != nil {
		return nil, fmt.Errorf("failed to get disk stats: %w", err)
	}

	return &SystemStats{
		CPU:    *cpuStats,
		Memory: *memStats,
		Disk:   *diskStats,
	}, nil
}

// getCPUStats retrieves CPU usage statistics
func getCPUStats() (*CPUStats, error) {
	// Get CPU percentage over 1 second interval
	percentages, err := cpu.Percent(time.Second, false)
	if err != nil {
		return nil, err
	}

	var usagePercent float64
	if len(percentages) > 0 {
		usagePercent = percentages[0]
	}

	// Get number of CPU cores
	cores := runtime.NumCPU()

	return &CPUStats{
		UsagePercent: usagePercent,
		Cores:        cores,
	}, nil
}

// getMemoryStats retrieves memory usage statistics
func getMemoryStats() (*MemoryStats, error) {
	vmStat, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	return &MemoryStats{
		Total:       vmStat.Total,
		Available:   vmStat.Available,
		Used:        vmStat.Used,
		UsedPercent: vmStat.UsedPercent,
		Free:        vmStat.Free,
	}, nil
}

// getDiskStats retrieves disk usage statistics for a given path
func getDiskStats(path string) (*DiskStats, error) {
	usage, err := disk.Usage(path)
	if err != nil {
		return nil, err
	}

	return &DiskStats{
		Total:       usage.Total,
		Used:        usage.Used,
		Free:        usage.Free,
		UsedPercent: usage.UsedPercent,
	}, nil
}

// GetDiskStatsForPath retrieves disk usage statistics for a specific path
// Useful for monitoring log directory specifically
func GetDiskStatsForPath(path string) (*DiskStats, error) {
	return getDiskStats(path)
}