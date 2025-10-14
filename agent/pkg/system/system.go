package system

import (
	"fmt"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/hhftechnology/traefik-log-dashboard/agent/pkg/logger"
)

// SystemInfo represents system information for the API response
type SystemInfo struct {
	Uptime    int64      `json:"uptime"`
	Timestamp string     `json:"timestamp"`
	CPU       CPUStats   `json:"cpu"`
	Memory    MemoryStats `json:"memory"`
	Disk      DiskStats   `json:"disk"`
}

// CPUStats represents CPU statistics with percentage
type CPUStats struct {
	Model        string    `json:"model"`
	Cores        int       `json:"cores"`
	Speed        float64   `json:"speed"`
	UsagePercent float64   `json:"usage_percent"` // Changed from Usage to UsagePercent
	CoreUsage    []float64 `json:"coreUsage"`
}

// MemoryStats represents memory statistics with percentage
type MemoryStats struct {
	Free        uint64  `json:"free"`
	Available   uint64  `json:"available"`
	Used        uint64  `json:"used"`
	Total       uint64  `json:"total"`
	UsedPercent float64 `json:"used_percent"` // Added percentage calculation
}

// DiskStats represents aggregated disk statistics with percentage
type DiskStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"used_percent"` // Added percentage calculation
}

// DiskInfo represents individual disk information (internal use)
type DiskInfo struct {
	Filesystem string `json:"filesystem"`
	Size       uint64 `json:"size"`
	Used       uint64 `json:"used"`
	Free       uint64 `json:"free"`
	MountedOn  string `json:"mountedOn"`
}

func MeasureSystem() (SystemInfo, error) {
	uptime, err := getUptime()
	if err != nil {
		logger.Log.Printf("Warning: Could not get uptime: %v", err)
		uptime = 0
	}

	cpuStats, err := getCPUStats()
	if err != nil {
		return SystemInfo{}, fmt.Errorf("failed to get CPU stats: %w", err)
	}

	memoryStats, err := getMemoryStats()
	if err != nil {
		return SystemInfo{}, fmt.Errorf("failed to get memory stats: %w", err)
	}

	diskStats, err := getDiskStats()
	if err != nil {
		return SystemInfo{}, fmt.Errorf("failed to get disk stats: %w", err)
	}

	return SystemInfo{
		Uptime:    uptime,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		CPU:       cpuStats,
		Memory:    memoryStats,
		Disk:      diskStats,
	}, nil
}

func getCPUStats() (CPUStats, error) {
	// Try gopsutil first
	cpuInfo, err := cpu.Info()
	if err != nil {
		logger.Log.Printf("gopsutil cpu.Info() failed: %v, trying OS-specific fallback", err)
		return getCPUStatsFallback()
	}

	if len(cpuInfo) == 0 {
		logger.Log.Printf("gopsutil returned empty CPU info, trying OS-specific fallback")
		return getCPUStatsFallback()
	}

	// Get per-CPU usage (set percpu=true)
	cpuUsage, err := cpu.Percent(time.Second, true)
	if err != nil {
		logger.Log.Printf("Warning: Could not get CPU usage: %v", err)
		cpuUsage = make([]float64, len(cpuInfo))
	}

	model := cpuInfo[0].ModelName
	cores := len(cpuUsage)
	if cores == 0 {
		cores = runtime.NumCPU()
		cpuUsage = make([]float64, cores)
	}
	speed := cpuInfo[0].Mhz

	// Calculate average usage across all cores
	var overallUsage float64
	if len(cpuUsage) > 0 {
		var total float64
		for _, usage := range cpuUsage {
			total += usage
		}
		overallUsage = total / float64(len(cpuUsage))
	}

	return CPUStats{
		Model:        model,
		Cores:        cores,
		Speed:        speed,
		UsagePercent: parseFloat(overallUsage, 1),
		CoreUsage:    cpuUsage,
	}, nil
}

func getCPUStatsFallback() (CPUStats, error) {
	switch runtime.GOOS {
	case "darwin":
		return getCPUInfoMacOS()
	case "windows":
		return getCPUInfoWindows()
	default:
		return getCPUInfoLinux()
	}
}

func getCPUInfoMacOS() (CPUStats, error) {
	var stats CPUStats

	// Get CPU model
	cmd := exec.Command("sysctl", "-n", "machdep.cpu.brand_string")
	output, err := cmd.Output()
	if err == nil {
		stats.Model = strings.TrimSpace(string(output))
	} else {
		stats.Model = "Unknown"
	}

	// Get CPU core count
	cmd = exec.Command("sysctl", "-n", "hw.ncpu")
	output, err = cmd.Output()
	if err == nil {
		if cores, err := strconv.Atoi(strings.TrimSpace(string(output))); err == nil {
			stats.Cores = cores
		}
	} else {
		stats.Cores = runtime.NumCPU()
	}

	// Get CPU frequency
	freqKeys := []string{"hw.cpufrequency_max", "hw.cpufrequency", "machdep.cpu.max_basic"}
	for _, key := range freqKeys {
		cmd = exec.Command("sysctl", "-n", key)
		output, err = cmd.Output()
		if err == nil {
			if freq, err := strconv.ParseFloat(strings.TrimSpace(string(output)), 64); err == nil {
				if freq > 1000000 {
					stats.Speed = freq / 1000000
				} else {
					stats.Speed = freq
				}
				break
			}
		}
	}

	// Get CPU usage
	cpuUsage, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuUsage) > 0 {
		stats.UsagePercent = parseFloat(cpuUsage[0], 1)
	}

	return stats, nil
}

func getCPUInfoWindows() (CPUStats, error) {
	var stats CPUStats

	cmd := exec.Command("wmic", "cpu", "get", "Name,NumberOfCores,MaxClockSpeed", "/format:csv")
	output, err := cmd.Output()
	if err != nil {
		return stats, err
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, ",") && !strings.Contains(line, "Node") {
			parts := strings.Split(line, ",")
			if len(parts) >= 4 {
				stats.Model = strings.TrimSpace(parts[2])
				if cores, err := strconv.Atoi(strings.TrimSpace(parts[3])); err == nil {
					stats.Cores = cores
				}
				if speed, err := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64); err == nil {
					stats.Speed = speed
				}
				break
			}
		}
	}

	// Get CPU usage
	cpuUsage, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuUsage) > 0 {
		stats.UsagePercent = parseFloat(cpuUsage[0], 1)
	}

	return stats, nil
}

func getCPUInfoLinux() (CPUStats, error) {
	var stats CPUStats

	cmd := exec.Command("cat", "/proc/cpuinfo")
	output, err := cmd.Output()
	if err != nil {
		return stats, err
	}

	lines := strings.Split(string(output), "\n")
	coreCount := 0
	for _, line := range lines {
		if strings.HasPrefix(line, "model name") {
			parts := strings.Split(line, ":")
			if len(parts) >= 2 {
				stats.Model = strings.TrimSpace(parts[1])
			}
		} else if strings.HasPrefix(line, "cpu MHz") {
			parts := strings.Split(line, ":")
			if len(parts) >= 2 {
				if speed, err := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64); err == nil {
					stats.Speed = speed
				}
			}
		} else if strings.HasPrefix(line, "processor") {
			coreCount++
		}
	}
	stats.Cores = coreCount

	// Get CPU usage
	cpuUsage, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuUsage) > 0 {
		stats.UsagePercent = parseFloat(cpuUsage[0], 1)
	}

	return stats, nil
}

func getMemoryStats() (MemoryStats, error) {
	vmStat, err := mem.VirtualMemory()
	if err != nil {
		return MemoryStats{}, err
	}

	// Calculate used percentage
	usedPercent := 0.0
	if vmStat.Total > 0 {
		usedPercent = (float64(vmStat.Used) / float64(vmStat.Total)) * 100.0
	}

	return MemoryStats{
		Free:        vmStat.Free,
		Available:   vmStat.Available,
		Used:        vmStat.Used,
		Total:       vmStat.Total,
		UsedPercent: parseFloat(usedPercent, 1),
	}, nil
}

func getDiskStats() (DiskStats, error) {
	disks, err := getDiskInfo()
	if err != nil {
		return DiskStats{}, err
	}

	if len(disks) == 0 {
		return DiskStats{}, fmt.Errorf("no disk information available")
	}

	// Aggregate all disk stats
	var totalSize, totalUsed, totalFree uint64
	for _, disk := range disks {
		totalSize += disk.Size
		totalUsed += disk.Used
		totalFree += disk.Free
	}

	// Calculate used percentage
	usedPercent := 0.0
	if totalSize > 0 {
		usedPercent = (float64(totalUsed) / float64(totalSize)) * 100.0
	}

	return DiskStats{
		Total:       totalSize,
		Used:        totalUsed,
		Free:        totalFree,
		UsedPercent: parseFloat(usedPercent, 1),
	}, nil
}

func getDiskInfo() ([]DiskInfo, error) {
	var disks []DiskInfo

	partitions, err := disk.Partitions(false)
	if err != nil {
		return nil, err
	}

	for _, partition := range partitions {
		usage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			logger.Log.Printf("Error getting disk usage for %s: %v", partition.Mountpoint, err)
			continue
		}

		disks = append(disks, DiskInfo{
			Filesystem: partition.Device,
			Size:       usage.Total,
			Used:       usage.Used,
			Free:       usage.Free,
			MountedOn:  partition.Mountpoint,
		})
	}

	return disks, nil
}

func getUptime() (int64, error) {
	switch runtime.GOOS {
	case "windows":
		cmd := exec.Command("systeminfo")
		output, err := cmd.Output()
		if err != nil {
			return 0, err
		}
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			if strings.Contains(line, "System Boot Time") {
				bootTimeStr := strings.TrimSpace(strings.Split(line, ":")[1])
				bootTime, err := time.Parse("1/2/2006, 3:04:05 PM", bootTimeStr)
				if err != nil {
					return 0, err
				}
				return int64(time.Since(bootTime).Seconds()), nil
			}
		}
		return 0, fmt.Errorf("could not determine system uptime")

	case "darwin":
		cmd := exec.Command("sysctl", "-n", "kern.boottime")
		output, err := cmd.Output()
		if err != nil {
			return 0, err
		}

		parts := strings.Split(string(output), "sec = ")
		if len(parts) < 2 {
			return 0, fmt.Errorf("unexpected sysctl output format")
		}

		bootTimeParts := strings.Split(parts[1], ",")
		bootTimeStr := strings.TrimSpace(bootTimeParts[0])
		bootTime, err := strconv.ParseInt(bootTimeStr, 10, 64)
		if err != nil {
			return 0, err
		}

		currentTime := time.Now().Unix()
		return currentTime - bootTime, nil

	default:
		cmd := exec.Command("cat", "/proc/uptime")
		output, err := cmd.Output()
		if err != nil {
			return 0, err
		}

		uptimeStr := strings.Split(string(output), " ")[0]
		uptimeFloat, err := strconv.ParseFloat(uptimeStr, 64)
		if err != nil {
			return 0, err
		}

		return int64(uptimeFloat), nil
	}
}

func parseFloat(val float64, precision int) float64 {
	format := fmt.Sprintf("%%.%df", precision)
	formatted := fmt.Sprintf(format, val)
	result, _ := strconv.ParseFloat(formatted, 64)
	return result
}