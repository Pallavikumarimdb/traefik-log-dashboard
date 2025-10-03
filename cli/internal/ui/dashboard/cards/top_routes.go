package cards

import (
	"fmt"
	"strings"

	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/logs"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// RenderTopRoutes renders the top routes card
func RenderTopRoutes(routes []logs.RouteMetric, width int) string {
	if len(routes) == 0 {
		return Render("🔀 Top Routes", styles.MutedStyle.Render("No routes data"), width)
	}

	var lines []string
	maxCount := routes[0].Count

	for i, route := range routes {
		if i >= 8 { // Limit to top 8 routes
			break
		}

		// Truncate path if too long
		path := truncate(route.Path, width-25)
		
		// Create progress bar
		barWidth := (width - 30)
		if barWidth < 10 {
			barWidth = 10
		}
		
		percent := float64(route.Count) / float64(maxCount) * 100
		bar := styles.ProgressBar(percent, barWidth)

		line := fmt.Sprintf(
			"%s %s\n  %s  %s req  %.0f ms",
			styles.MutedStyle.Render(fmt.Sprintf("%2d.", i+1)),
			path,
			bar,
			formatNumber(route.Count),
			route.AvgDuration,
		)

		lines = append(lines, line)
	}

	content := strings.Join(lines, "\n\n")
	return Render("🔀 Top Routes", content, width)
}

// truncate truncates a string to maxLen
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	if maxLen < 3 {
		return s[:maxLen]
	}
	return s[:maxLen-3] + "..."
}