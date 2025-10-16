package cards

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/logs"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// RenderRouters renders the routers metrics card
func RenderRouters(routers []logs.RouterMetric, width int) string {
	if width < 40 {
		return ""
	}

	cardWidth := width
	contentWidth := cardWidth - 4

	var b strings.Builder

	// Header
	b.WriteString(styles.CardTitleStyle.Width(cardWidth).Render("🔀 Routers"))
	b.WriteString("\n")

	if len(routers) == 0 {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.MutedStyle.Render("No router data available"),
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
		styles.TableHeaderStyle.Width(nameWidth).Render("Router"),
		styles.TableHeaderStyle.Width(metricsWidth).Render("Metrics"),
	)
	b.WriteString(header)
	b.WriteString("\n")

	// Limit to top 8 routers
	displayCount := len(routers)
	if displayCount > 8 {
		displayCount = 8
	}

	for i := 0; i < displayCount; i++ {
		router := routers[i]

		// Truncate router name if too long
		routerName := router.Name
		if len(routerName) > nameWidth-2 {
			routerName = routerName[:nameWidth-5] + "..."
		}

		// FIX: Removed reference to router.ErrorRate which does not exist
		metricsText := fmt.Sprintf(
			"Req: %s  Avg: %s",
			formatNumber(router.Count),
			formatDuration(router.AvgDuration),
		)

		// Create progress bar for request volume
		maxRequests := routers[0].Count
		if maxRequests == 0 {
			maxRequests = 1
		}
		barWidth := metricsWidth - 2
		if barWidth > 30 {
			barWidth = 30
		}
		// FIX: Removed error condition from progress bar
		requestBar := renderProgressBar(float64(router.Count)/float64(maxRequests), barWidth, false)

		// Router name cell
		nameCell := styles.TableCellStyle.Width(nameWidth).Render(routerName)

		// Metrics cell with progress bar
		metricsContent := fmt.Sprintf("%s\n%s", metricsText, requestBar)
		metricsCell := styles.TableCellStyle.Width(metricsWidth).Render(metricsContent)

		row := lipgloss.JoinHorizontal(lipgloss.Top, nameCell, metricsCell)
		b.WriteString(row)
		b.WriteString("\n")
	}

	if len(routers) > displayCount {
		footer := styles.MutedStyle.Render(
			fmt.Sprintf("... and %d more routers", len(routers)-displayCount),
		)
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(footer))
		b.WriteString("\n")
	}

	return b.String()
}