package cards

import (
	"fmt"

	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// RenderRequests renders the requests metrics card
func RenderRequests(total int, perSec float64, width int) string {
	content := fmt.Sprintf(
		"%s\n\n%s requests\n%s",
		styles.CardTitleStyle.Render("📊 Total Requests"),
		styles.CardValueStyle.Render(formatNumber(total)),
		styles.CardLabelStyle.Render(fmt.Sprintf("%.2f req/s", perSec)),
	)

	return styles.CardStyle.Width(width).Render(content)
}

// formatNumber formats an integer with thousand separators
func formatNumber(n int) string {
	if n < 1000 {
		return fmt.Sprintf("%d", n)
	}

	if n < 1000000 {
		thousands := n / 1000
		remainder := n % 1000
		return fmt.Sprintf("%d,%03d", thousands, remainder)
	}

	millions := n / 1000000
	thousands := (n % 1000000) / 1000
	remainder := n % 1000
	return fmt.Sprintf("%d,%03d,%03d", millions, thousands, remainder)
}