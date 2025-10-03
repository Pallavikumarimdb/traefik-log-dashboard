package cards

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// SystemStats represents system resource statistics
type SystemStats struct {
	CPU    CPUStats    `json:"cpu"`
	Memory MemoryStats `json:"memory"`
	Disk   DiskStats   `json:"disk"`
}

// CPUStats represents CPU statistics
type CPUStats struct {
	UsagePercent float64 `json:"usagePercent"`
	Cores        int     `json:"cores"`
}

// MemoryStats represents memory statistics
type MemoryStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
}

// DiskStats represents disk statistics
type DiskStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
}

// RenderSystemStats renders system resource statistics
func RenderSystemStats(stats *SystemStats, width int) string {
	if width < 40 {
		return ""
	}

	cardWidth := width
	contentWidth := cardWidth - 4

	var b strings.Builder

	// Header
	b.WriteString(styles.CardTitleStyle.Width(cardWidth).Render("💻 System Resources"))
	b.WriteString("\n")

	if stats == nil {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.MutedStyle.Render("System stats unavailable"),
		))
		return b.String()
	}

	// CPU Usage
	cpuLine := renderResourceLine("CPU", stats.CPU.UsagePercent, contentWidth)
	cpuDetail := fmt.Sprintf("    %d cores", stats.CPU.Cores)
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(cpuLine))
	b.WriteString("\n")
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(
		styles.MutedStyle.Render(cpuDetail),
	))
	b.WriteString("\n")

	// Memory Usage
	memLine := renderResourceLine("Memory", stats.Memory.UsedPercent, contentWidth)
	memDetail := fmt.Sprintf(
		"    %s / %s",
		formatBytes(stats.Memory.Used),
		formatBytes(stats.Memory.Total),
	)
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(memLine))
	b.WriteString("\n")
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(
		styles.MutedStyle.Render(memDetail),
	))
	b.WriteString("\n")

	// Disk Usage
	diskLine := renderResourceLine("Disk", stats.Disk.UsedPercent, contentWidth)
	diskDetail := fmt.Sprintf(
		"    %s / %s",
		formatBytes(stats.Disk.Used),
		formatBytes(stats.Disk.Total),
	)
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(diskLine))
	b.WriteString("\n")
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(
		styles.MutedStyle.Render(diskDetail),
	))
	b.WriteString("\n")

	return b.String()
}

// renderResourceLine renders a single resource usage line with progress bar
func renderResourceLine(name string, percentage float64, width int) string {
	barWidth := width - 25
	if barWidth < 20 {
		barWidth = 20
	}
	if barWidth > 40 {
		barWidth = 40
	}

	// Determine color based on usage
	var barStyle lipgloss.Style
	if percentage >= 90 {
		barStyle = styles.ErrorStyle
	} else if percentage >= 75 {
		barStyle = styles.WarningStyle
	} else {
		barStyle = styles.SuccessStyle
	}

	filled := int(percentage / 100.0 * float64(barWidth))
	if filled > barWidth {
		filled = barWidth
	}

	bar := strings.Repeat("█", filled) + strings.Repeat("░", barWidth-filled)
	coloredBar := barStyle.Render(bar)

	return fmt.Sprintf("%-8s  %5.1f%%  %s", name, percentage, coloredBar)
}

// formatBytes formats bytes into human-readable format
func formatBytes(bytes uint64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}

	div, exp := uint64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}

	units := []string{"KB", "MB", "GB", "TB", "PB"}
	if exp >= len(units) {
		exp = len(units) - 1
	}

	return fmt.Sprintf("%.1f %s", float64(bytes)/float64(div), units[exp])
}

// RenderSystemHealth renders an overall system health summary
func RenderSystemHealth(stats *SystemStats, width int) string {
	if width < 40 {
		return ""
	}

	cardWidth := width
	var b strings.Builder

	// Header
	b.WriteString(styles.CardTitleStyle.Width(cardWidth).Render("🏥 System Health"))
	b.WriteString("\n")

	if stats == nil {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.MutedStyle.Render("Health check unavailable"),
		))
		return b.String()
	}

	// Calculate overall health score
	healthScore := calculateHealthScore(stats)
	healthStatus := getHealthStatus(healthScore)
	healthEmoji := getHealthEmoji(healthScore)

	statusLine := fmt.Sprintf(
		"%s Overall Health: %s (%.0f%%)",
		healthEmoji,
		healthStatus,
		healthScore,
	)

	var statusStyle lipgloss.Style
	if healthScore >= 80 {
		statusStyle = styles.SuccessStyle
	} else if healthScore >= 60 {
		statusStyle = styles.WarningStyle
	} else {
		statusStyle = styles.ErrorStyle
	}

	b.WriteString(styles.CardStyle.Width(cardWidth).Render(
		statusStyle.Render(statusLine),
	))
	b.WriteString("\n")

	// Individual resource status
	cpuStatus := getResourceStatus(stats.CPU.UsagePercent)
	memStatus := getResourceStatus(stats.Memory.UsedPercent)
	diskStatus := getResourceStatus(stats.Disk.UsedPercent)

	details := fmt.Sprintf(
		"CPU: %s  |  Memory: %s  |  Disk: %s",
		cpuStatus,
		memStatus,
		diskStatus,
	)

	b.WriteString(styles.CardStyle.Width(cardWidth).Render(
		styles.MutedStyle.Render(details),
	))
	b.WriteString("\n")

	// Recommendations if needed
	if healthScore < 80 {
		recommendations := getHealthRecommendations(stats)
		if len(recommendations) > 0 {
			b.WriteString(styles.CardStyle.Width(cardWidth).Render(
				styles.WarningStyle.Render("⚠ Recommendations:"),
			))
			b.WriteString("\n")
			for _, rec := range recommendations {
				b.WriteString(styles.CardStyle.Width(cardWidth).Render(
					styles.MutedStyle.Render("  • "+rec),
				))
				b.WriteString("\n")
			}
		}
	}

	return b.String()
}

// calculateHealthScore calculates an overall health score (0-100)
func calculateHealthScore(stats *SystemStats) float64 {
	cpuScore := 100.0 - stats.CPU.UsagePercent
	memScore := 100.0 - stats.Memory.UsedPercent
	diskScore := 100.0 - stats.Disk.UsedPercent

	// Weighted average (CPU and memory more important than disk)
	return (cpuScore*0.4 + memScore*0.4 + diskScore*0.2)
}

// getHealthStatus returns a text status based on health score
func getHealthStatus(score float64) string {
	if score >= 80 {
		return "Excellent"
	} else if score >= 60 {
		return "Good"
	} else if score >= 40 {
		return "Fair"
	} else if score >= 20 {
		return "Poor"
	}
	return "Critical"
}

// getHealthEmoji returns an emoji based on health score
func getHealthEmoji(score float64) string {
	if score >= 80 {
		return "✅"
	} else if score >= 60 {
		return "⚠️"
	}
	return "❌"
}

// getResourceStatus returns a status indicator for a resource
func getResourceStatus(percentage float64) string {
	if percentage < 60 {
		return "✓ OK"
	} else if percentage < 80 {
		return "⚠ High"
	}
	return "✗ Critical"
}

// getHealthRecommendations returns recommendations based on system stats
func getHealthRecommendations(stats *SystemStats) []string {
	var recommendations []string

	if stats.CPU.UsagePercent >= 80 {
		recommendations = append(recommendations, "CPU usage is high - consider scaling or optimizing")
	}

	if stats.Memory.UsedPercent >= 80 {
		recommendations = append(recommendations, "Memory usage is high - check for memory leaks")
	}

	if stats.Disk.UsedPercent >= 90 {
		recommendations = append(recommendations, "Disk space is critically low - clean up old logs")
	} else if stats.Disk.UsedPercent >= 80 {
		recommendations = append(recommendations, "Disk space is running low - monitor closely")
	}

	return recommendations
}