package cards

import (
	"fmt"

	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// RenderResponseTime renders the response time metrics card
func RenderResponseTime(avg, p95, p99 float64, width int) string {
	content := fmt.Sprintf(
		"%s\n\n%s\n%s\n%s",
		styles.CardTitleStyle.Render("⚡ Response Time"),
		styles.CardValueStyle.Render(fmt.Sprintf("%.0f ms", avg)),
		styles.CardLabelStyle.Render(fmt.Sprintf("P95: %.0f ms", p95)),
		styles.CardLabelStyle.Render(fmt.Sprintf("P99: %.0f ms", p99)),
	)

	return styles.CardStyle.Width(width).Render(content)
}