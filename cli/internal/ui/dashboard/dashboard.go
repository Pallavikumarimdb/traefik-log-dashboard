package dashboard

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/logs"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/dashboard/cards"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// Render renders the dashboard view
func Render(metrics *logs.Metrics, systemStats *logs.SystemStats, width, height int) string {
	if metrics == nil {
		return styles.MutedStyle.Render("No metrics available")
	}

	var sections []string

	// Top metrics row
	topRow := renderTopMetrics(metrics, width)
	sections = append(sections, topRow)

	// Middle section - routes and services
	middleRow := renderMiddleSection(metrics, width)
	sections = append(sections, middleRow)

	// Bottom section - system stats if available
	if systemStats != nil {
		bottomRow := renderSystemStats(systemStats, width)
		sections = append(sections, bottomRow)
	}

	return lipgloss.JoinVertical(lipgloss.Left, sections...)
}

// renderTopMetrics renders the top row of metrics
func renderTopMetrics(metrics *logs.Metrics, width int) string {
	cardWidth := (width - 12) / 3

	requestsCard := cards.RenderRequests(metrics.TotalRequests, metrics.RequestsPerSec, cardWidth)
	responseCard := cards.RenderResponseTime(metrics.AvgResponseTime, metrics.P95ResponseTime, metrics.P99ResponseTime, cardWidth)
	statusCard := cards.RenderStatusCodes(metrics.Status2xx, metrics.Status3xx, metrics.Status4xx, metrics.Status5xx, metrics.ErrorRate, cardWidth)

	return lipgloss.JoinHorizontal(
		lipgloss.Top,
		requestsCard,
		"  ",
		responseCard,
		"  ",
		statusCard,
	)
}

// renderMiddleSection renders the middle section with routes and services
func renderMiddleSection(metrics *logs.Metrics, width int) string {
	halfWidth := (width - 4) / 2

	routesCard := cards.RenderTopRoutes(metrics.TopRoutes, halfWidth)
	servicesCard := cards.RenderBackends(metrics.TopServices, halfWidth)

	return lipgloss.JoinHorizontal(
		lipgloss.Top,
		routesCard,
		"  ",
		servicesCard,
	)
}

// renderSystemStats renders system statistics
func renderSystemStats(stats *logs.SystemStats, width int) string {
	cardWidth := (width - 12) / 3

	cpuCard := renderCPUCard(stats.CPU, cardWidth)
	memCard := renderMemoryCard(stats.Memory, cardWidth)
	diskCard := renderDiskCard(stats.Disk, cardWidth)

	return lipgloss.JoinHorizontal(
		lipgloss.Top,
		cpuCard,
		"  ",
		memCard,
		"  ",
		diskCard,
	)
}

// renderCPUCard renders CPU statistics card
func renderCPUCard(cpu logs.CPUStats, width int) string {
	content := fmt.Sprintf(
		"%s\n\n%s\n%s",
		styles.CardTitleStyle.Render("CPU Usage"),
		styles.CardValueStyle.Render(fmt.Sprintf("%.1f%%", cpu.UsagePercent)),
		styles.CardLabelStyle.Render(fmt.Sprintf("%d cores", cpu.Cores)),
	)

	return styles.CardStyle.Width(width).Render(content)
}

// renderMemoryCard renders memory statistics card
func renderMemoryCard(mem logs.MemoryStats, width int) string {
	usedGB := float64(mem.Used) / 1024 / 1024 / 1024
	totalGB := float64(mem.Total) / 1024 / 1024 / 1024

	content := fmt.Sprintf(
		"%s\n\n%s\n%s\n%s",
		styles.CardTitleStyle.Render("Memory"),
		styles.CardValueStyle.Render(fmt.Sprintf("%.1f%%", mem.UsedPercent)),
		styles.CardLabelStyle.Render(fmt.Sprintf("%.1f GB / %.1f GB", usedGB, totalGB)),
		styles.ProgressBar(mem.UsedPercent, width-6),
	)

	return styles.CardStyle.Width(width).Render(content)
}

// renderDiskCard renders disk statistics card
func renderDiskCard(disk logs.DiskStats, width int) string {
	usedGB := float64(disk.Used) / 1024 / 1024 / 1024
	totalGB := float64(disk.Total) / 1024 / 1024 / 1024

	content := fmt.Sprintf(
		"%s\n\n%s\n%s\n%s",
		styles.CardTitleStyle.Render("Disk"),
		styles.CardValueStyle.Render(fmt.Sprintf("%.1f%%", disk.UsedPercent)),
		styles.CardLabelStyle.Render(fmt.Sprintf("%.1f GB / %.1f GB", usedGB, totalGB)),
		styles.ProgressBar(disk.UsedPercent, width-6),
	)

	return styles.CardStyle.Width(width).Render(content)
}

// truncate truncates a string to maxLen
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

// padRight pads a string to the right with spaces
func padRight(s string, length int) string {
	if len(s) >= length {
		return s
	}
	return s + strings.Repeat(" ", length-len(s))
}