package cards

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/logs"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// RenderBackends renders the backends/services metrics card
func RenderBackends(services []logs.ServiceMetric, width int) string {
	if width < 40 {
		return ""
	}

	cardWidth := width
	contentWidth := cardWidth - 4 // Account for borders and padding

	var b strings.Builder

	// Header
	b.WriteString(styles.CardTitleStyle.Width(cardWidth).Render("⚙  Backends/Services"))
	b.WriteString("\n")

	if len(services) == 0 {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.MutedStyle.Render("No service data available"),
		))
		return b.String()
	}

	// Calculate column widths
	nameWidth := contentWidth / 2
	if nameWidth > 40 {
		nameWidth = 40
	}
	metricsWidth := contentWidth - nameWidth - 2

	// Table header
	header := lipgloss.JoinHorizontal(
		lipgloss.Top,
		styles.TableHeaderStyle.Width(nameWidth).Render("Service"),
		styles.TableHeaderStyle.Width(metricsWidth).Render("Metrics"),
	)
	b.WriteString(header)
	b.WriteString("\n")

	// Limit to top 8 services
	displayCount := len(services)
	if displayCount > 8 {
		displayCount = 8
	}

	for i := 0; i < displayCount; i++ {
		svc := services[i]

		// Truncate service name if too long
		serviceName := svc.Name
		if len(serviceName) > nameWidth-2 {
			serviceName = serviceName[:nameWidth-5] + "..."
		}

		// Format metrics
		metricsText := fmt.Sprintf(
			"Req: %s  Avg: %s  Err: %.1f%%",
			formatNumber(svc.Count),
			formatDuration(svc.AvgDuration),
			svc.ErrorRate*100,
		)

		// Create progress bar for request volume (relative to max)
		maxRequests := services[0].Count
		if maxRequests == 0 {
			maxRequests = 1
		}
		barWidth := metricsWidth - 2
		if barWidth > 30 {
			barWidth = 30
		}
		requestBar := renderProgressBar(float64(svc.Count)/float64(maxRequests), barWidth, svc.ErrorRate > 0.05)

		// Service name cell
		nameCell := styles.TableCellStyle.Width(nameWidth).Render(serviceName)

		// Metrics cell with progress bar
		metricsContent := fmt.Sprintf("%s\n%s", metricsText, requestBar)
		metricsCell := styles.TableCellStyle.Width(metricsWidth).Render(metricsContent)

		row := lipgloss.JoinHorizontal(lipgloss.Top, nameCell, metricsCell)
		b.WriteString(row)
		b.WriteString("\n")
	}

	if len(services) > displayCount {
		footer := styles.MutedStyle.Render(
			fmt.Sprintf("... and %d more services", len(services)-displayCount),
		)
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(footer))
		b.WriteString("\n")
	}

	return b.String()
}

// renderProgressBar renders a horizontal progress bar
func renderProgressBar(percentage float64, width int, isError bool) string {
	if width < 5 {
		return ""
	}

	filled := int(percentage * float64(width))
	if filled > width {
		filled = width
	}

	bar := strings.Repeat("█", filled) + strings.Repeat("░", width-filled)

	barStyle := styles.SuccessStyle
	if isError {
		barStyle = styles.ErrorStyle
	}

	return barStyle.Render(bar)
}

// formatNumber is implemented in requests.go to avoid duplicate declarations across the package.

// formatDuration formats a duration in milliseconds
func formatDuration(ms float64) string {
	if ms >= 1000 {
		return fmt.Sprintf("%.2fs", ms/1000)
	}
	return fmt.Sprintf("%.0fms", ms)
}