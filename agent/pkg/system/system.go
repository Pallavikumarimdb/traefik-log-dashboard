package system

import (
	"context"
	"fmt"
	"math"
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

const commandTimeout = 5 * time.Second

// SystemInfo represents system information for the API response
type SystemInfo struct {
	Uptime    int64       `json:"uptime"`
	Timestamp string      `json:"timestamp"`
	CPU       CPUStats    `json:"cpu"`
	Memory    MemoryStats `json:"memory"`
	Disk      DiskStats   `json:"disk"`
}

// CPUStats represents CPU statistics with percentage
type CPUStats struct {
	Model        string    `json:"model"`
	Cores        int       `json:"cores"`
	Speed        float64   `json:"speed"`
	UsagePercent float64   `json:"usage_percent"`
	CoreUsage    []float64 `json:"coreUsage"`
}

// MemoryStats represents memory statistics with percentage
type MemoryStats struct {
	Free        uint64  `json:"free"`
	Available   uint64  `json:"available"`
	Used        uint64  `json:"used"`
	Total       uint64  `json:"total"`
	UsedPercent float64 `json:"used_percent"`
}

// DiskStats represents aggregated disk statistics with percentage
type DiskStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"used_percent"`
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
		cpuUsage = make([]float64, runtime.NumCPU())
	}

	model := cpuInfo[0].ModelName
	cores := len(cpuUsage)
	
	// FIX BUG #2: Ensure cores is never zero
	if cores == 0 {
		cores = runtime.NumCPU()
		if cores == 0 {
			cores = 1 // Absolute minimum fallback
		}
		cpuUsage = make([]float64, cores)
	}
	
	speed := cpuInfo[0].Mhz

	// FIX BUG #2: Safe division - handle empty cpuUsage
	var overallUsage float64
	if len(cpuUsage) > 0 {
		var total float64
		for _, usage := range cpuUsage {
			total += usage
		}
		overallUsage = total / float64(len(cpuUsage))
	} else {
		overallUsage = 0.0 // Safe default when no CPU usage available
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
	ctx, cancel := context.WithTimeout(context.Background(), commandTimeout)
	defer cancel()

	// Get CPU model
	cmd := exec.CommandContext(ctx, "sysctl", "-n", "machdep.cpu.brand_string")
	output, err := cmd.Output()
	if err == nil {
		stats.Model = strings.TrimSpace(string(output))
	} else {
		stats.Model = "Unknown"
	}

	// Get CPU core count
	cmd = exec.CommandContext(ctx, "sysctl", "-n", "hw.ncpu")
	output, err = cmd.Output()
	if err == nil {
		if cores, err := strconv.Atoi(strings.TrimSpace(string(output))); err == nil {
			stats.Cores = cores
		}
	} else {
		stats.Cores = runtime.NumCPU()
	}

	// FIX BUG #4: Improved CPU frequency detection for macOS
	// Try hw.cpufrequency_max first (Intel Macs, in Hz)
	cmd = exec.CommandContext(ctx, "sysctl", "-n", "hw.cpufrequency_max")
	output, err = cmd.Output()
	if err == nil {
		if freq, err := strconv.ParseFloat(strings.TrimSpace(string(output)), 64); err == nil && freq > 0 {
			stats.Speed = freq / 1000000 // Convert Hz to MHz
		}
	}

	// If still zero, try hw.cpufrequency (alternative, also in Hz)
	if stats.Speed == 0 {
		cmd = exec.CommandContext(ctx, "sysctl", "-n", "hw.cpufrequency")
		output, err = cmd.Output()
		if err == nil {
			if freq, err := strconv.ParseFloat(strings.TrimSpace(string(output)), 64); err == nil && freq > 0 {
				stats.Speed = freq / 1000000 // Convert Hz to MHz
			}
		}
	}

	// For Apple Silicon, frequency is not directly available - leave at 0
	// The brand string (stats.Model) will indicate M1/M2/M3 etc.

	// Get CPU usage
	cpuUsage, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuUsage) > 0 {
		stats.UsagePercent = parseFloat(cpuUsage[0], 1)
	}

	return stats, nil
}

func getCPUInfoWindows() (CPUStats, error) {
	var stats CPUStats
	ctx, cancel := context.WithTimeout(context.Background(), commandTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "wmic", "cpu", "get", "Name,NumberOfCores,MaxClockSpeed", "/format:csv")
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
	ctx, cancel := context.WithTimeout(context.Background(), commandTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "cat", "/proc/cpuinfo")
	output, err := cmd.Output()
	if err != nil {
		return stats, err
	}

	lines := strings.Split(string(output), "\n")
	logicalCores := 0
	physicalCores := 0
	
	// FIX BUG #5: Correctly count physical cores vs logical processors
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
		} else if strings.HasPrefix(line, "cpu cores") {
			// Physical cores (this is what we want!)
			parts := strings.Split(line, ":")
			if len(parts) >= 2 {
				if cores, err := strconv.Atoi(strings.TrimSpace(parts[1])); err == nil {
					physicalCores = cores
				}
			}
		} else if strings.HasPrefix(line, "processor") {
			logicalCores++ // Logical processors (includes hyperthreading)
		}
	}
	
	// Prefer physical cores, fallback to logical
	if physicalCores > 0 {
		stats.Cores = physicalCores
	} else if logicalCores > 0 {
		stats.Cores = logicalCores
	} else {
		stats.Cores = runtime.NumCPU()
	}

	// Final safety check
	if stats.Cores == 0 {
		stats.Cores = 1
	}

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

// FIX BUG #1: Filter pseudo filesystems and RAM disks
func getDiskInfo() ([]DiskInfo, error) {
	var disks []DiskInfo

	partitions, err := disk.Partitions(false)
	if err != nil {
		return nil, err
	}

	for _, partition := range partitions {
		// Skip pseudo filesystems and RAM disks
		if shouldSkipPartition(partition) {
			logger.Log.Printf("Skipping partition: %s (type: %s, mount: %s)", 
				partition.Device, partition.Fstype, partition.Mountpoint)
			continue
		}

		usage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			logger.Log.Printf("Error getting disk usage for %s: %v", partition.Mountpoint, err)
			continue
		}

		logger.Log.Printf("Including partition: %s (type: %s, size: %.2f GB)", 
			partition.Device, partition.Fstype, float64(usage.Total)/1024/1024/1024)

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

// shouldSkipPartition determines if a partition should be excluded from disk stats
func shouldSkipPartition(partition disk.PartitionStat) bool {
	// Skip common pseudo filesystems
	pseudoFsTypes := map[string]bool{
		"tmpfs":      true,
		"devtmpfs":   true,
		"devfs":      true,
		"sysfs":      true,
		"proc":       true,
		"squashfs":   true,
		"iso9660":    true,
		"overlay":    true,
		"aufs":       true,
		"cgroup":     true,
		"cgroup2":    true,
		"pstore":     true,
		"bpf":        true,
		"tracefs":    true,
		"debugfs":    true,
		"mqueue":     true,
		"hugetlbfs":  true,
		"fusectl":    true,
		"configfs":   true,
		"securityfs": true,
		"ramfs":      true,
	}

	if pseudoFsTypes[partition.Fstype] {
		return true
	}

	// Skip zram (compressed RAM) devices
	if strings.HasPrefix(partition.Device, "/dev/zram") {
		return true
	}

	// Skip loop devices (often used for snaps)
	if strings.HasPrefix(partition.Device, "/dev/loop") {
		return true
	}

	// Skip RAM disks
	if strings.HasPrefix(partition.Device, "/dev/ram") {
		return true
	}

	return false
}

func getUptime() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), commandTimeout)
	defer cancel()

	switch runtime.GOOS {
	case "windows":
		// FIX BUG #3: Use WMI for locale-independent parsing
		cmd := exec.CommandContext(ctx, "wmic", "os", "get", "LastBootUpTime", "/value")
		output, err := cmd.Output()
		if err != nil {
			return 0, err
		}

		// Parse: LastBootUpTime=20251024153045.500000+060
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			if strings.HasPrefix(line, "LastBootUpTime=") {
				timeStr := strings.TrimPrefix(line, "LastBootUpTime=")
				timeStr = strings.TrimSpace(timeStr)
				// Parse WMI datetime format: YYYYMMDDHHmmss.mmmmmm±UUU
				if len(timeStr) >= 14 {
					timeStr = timeStr[:14] // YYYYMMDDHHmmss
					bootTime, err := time.Parse("20060102150405", timeStr)
					if err != nil {
						return 0, err
					}
					return int64(time.Since(bootTime).Seconds()), nil
				}
			}
		}
		return 0, fmt.Errorf("could not determine system uptime")

	case "darwin":
		cmd := exec.CommandContext(ctx, "sysctl", "-n", "kern.boottime")
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
		cmd := exec.CommandContext(ctx, "cat", "/proc/uptime")
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

// FIX BUG #6: More efficient parseFloat using math.Round
func parseFloat(val float64, precision int) float64 {
	multiplier := math.Pow(10, float64(precision))
	return math.Round(val*multiplier) / multiplier
}
