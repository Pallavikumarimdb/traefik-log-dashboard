package cards

import (
	"fmt"
	"strings"
	"time" // Import the 'time' package

	"github.com/charmbracelet/lipgloss"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/logs"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// RenderErrors renders the recent errors card
func RenderErrors(errorLogs []logs.TraefikLog, width int) string {
	if width < 40 {
		return ""
	}

	cardWidth := width
	contentWidth := cardWidth - 4

	var b strings.Builder

	// Header with error count
	errorCount := len(errorLogs)
	headerText := fmt.Sprintf("⚠️  Recent Errors (%d)", errorCount)
	b.WriteString(styles.CardTitleStyle.Width(cardWidth).Render(headerText))
	b.WriteString("\n")

	if errorCount == 0 {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.SuccessStyle.Render("✓ No errors detected"),
		))
		return b.String()
	}

	// Limit to most recent 6 errors
	displayCount := errorCount
	if displayCount > 6 {
		displayCount = 6
	}

	for i := 0; i < displayCount; i++ {
		log := errorLogs[i]

		// FIX: Parse the timestamp string into a time.Time object before formatting
		var timestamp string
		parsedTime, err := time.Parse(time.RFC3339Nano, log.StartUTC)
		if err != nil {
			// If parsing fails, use a fallback or the raw string
			timestamp = "??:??:??"
		} else {
			timestamp = parsedTime.Format("15:04:05")
		}

		// Status code with color
		statusText := fmt.Sprintf("%d", log.DownstreamStatus)
		var statusStyle lipgloss.Style
		if log.DownstreamStatus >= 500 {
			statusStyle = styles.ErrorStyle
		} else if log.DownstreamStatus >= 400 {
			statusStyle = styles.WarningStyle
		} else {
			statusStyle = styles.MutedStyle
		}

		// Request info
		method := log.RequestMethod
		if len(method) > 7 {
			method = method[:7]
		}

		path := log.RequestPath
		maxPathLen := contentWidth - 35
		if maxPathLen < 20 {
			maxPathLen = 20
		}
		if len(path) > maxPathLen {
			path = path[:maxPathLen-3] + "..."
		}

		// Client info
		client := log.ClientHost
		if len(client) > 20 {
			client = client[:17] + "..."
		}

		// Build error entry
		errorLine := fmt.Sprintf(
			"%s %s %s %s → %s",
			styles.MutedStyle.Render(timestamp),
			statusStyle.Render(statusText),
			styles.AccentStyle.Render(method),
			path,
			styles.MutedStyle.Render(client),
		)

		b.WriteString(styles.CardStyle.Width(cardWidth).Render(errorLine))
		b.WriteString("\n")

		// Add router/service info if available
		if log.RouterName != "" || log.ServiceName != "" {
			detailLine := fmt.Sprintf(
				"    Router: %s | Service: %s",
				truncateString(log.RouterName, 20),
				truncateString(log.ServiceName, 20),
			)
			b.WriteString(styles.CardStyle.Width(cardWidth).Render(
				styles.MutedStyle.Render(detailLine),
			))
			b.WriteString("\n")
		}
	}

	if errorCount > displayCount {
		footer := styles.MutedStyle.Render(
			fmt.Sprintf("... and %d more errors", errorCount-displayCount),
		)
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(footer))
		b.WriteString("\n")
	}

	return b.String()
}


// RenderErrorSummary renders a summary of error types
func RenderErrorSummary(metrics *logs.Metrics, width int) string {
	if width < 40 {
		return ""
	}

	cardWidth := width
	var b strings.Builder

	// Header
	b.WriteString(styles.CardTitleStyle.Width(cardWidth).Render("📊 Error Summary"))
	b.WriteString("\n")

	// Calculate error counts
	total4xx := metrics.Status4xx
	total5xx := metrics.Status5xx
	totalErrors := total4xx + total5xx

	if totalErrors == 0 {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.SuccessStyle.Render("✓ No errors in current period"),
		))
		return b.String()
	}

	// Error rate
	errorRate := metrics.ErrorRate * 100
	errorRateText := fmt.Sprintf("Error Rate: %.2f%%", errorRate)
	var errorRateStyle lipgloss.Style
	if errorRate > 5.0 {
		errorRateStyle = styles.ErrorStyle
	} else if errorRate > 1.0 {
		errorRateStyle = styles.WarningStyle
	} else {
		errorRateStyle = styles.SuccessStyle
	}

	b.WriteString(styles.CardStyle.Width(cardWidth).Render(
		errorRateStyle.Render(errorRateText),
	))
	b.WriteString("\n")

	// 4xx vs 5xx breakdown
	barWidth := cardWidth - 20
	if barWidth > 40 {
		barWidth = 40
	}

	// 4xx errors
	pct4xx := 0.0
	if totalErrors > 0 {
		pct4xx = float64(total4xx) / float64(totalErrors)
	}
	bar4xx := renderColoredBar(pct4xx, barWidth, styles.WarningStyle)
	line4xx := fmt.Sprintf("4xx: %6d  %s", total4xx, bar4xx)
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(line4xx))
	b.WriteString("\n")

	// 5xx errors
	pct5xx := 0.0
	if totalErrors > 0 {
		pct5xx = float64(total5xx) / float64(totalErrors)
	}
	bar5xx := renderColoredBar(pct5xx, barWidth, styles.ErrorStyle)
	line5xx := fmt.Sprintf("5xx: %6d  %s", total5xx, bar5xx)
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(line5xx))
	b.WriteString("\n")

	return b.String()
}

// renderColoredBar renders a colored progress bar
func renderColoredBar(percentage float64, width int, style lipgloss.Style) string {
	if width < 5 {
		return ""
	}

	filled := int(percentage * float64(width))
	if filled > width {
		filled = width
	}

	bar := strings.Repeat("█", filled) + strings.Repeat("░", width-filled)
	return style.Render(bar)
}

// truncateString truncates a string to maxLen with ellipsis
func truncateString(s string, maxLen int) string {
	if s == "" {
		return "-"
	}
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}