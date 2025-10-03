package cards

import (
	"fmt"

	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// RenderStatusCodes renders the status codes metrics card
func RenderStatusCodes(status2xx, status3xx, status4xx, status5xx int, errorRate float64, width int) string {
	total := status2xx + status3xx + status4xx + status5xx

	var statusLines string
	if total > 0 {
		statusLines = fmt.Sprintf(
			"%s %s (%.1f%%)\n%s %s (%.1f%%)\n%s %s (%.1f%%)\n%s %s (%.1f%%)",
			styles.Status2xxStyle.Render("2xx"),
			formatNumber(status2xx),
			float64(status2xx)/float64(total)*100,
			styles.Status3xxStyle.Render("3xx"),
			formatNumber(status3xx),
			float64(status3xx)/float64(total)*100,
			styles.Status4xxStyle.Render("4xx"),
			formatNumber(status4xx),
			float64(status4xx)/float64(total)*100,
			styles.Status5xxStyle.Render("5xx"),
			formatNumber(status5xx),
			float64(status5xx)/float64(total)*100,
		)
	} else {
		statusLines = styles.MutedStyle.Render("No data")
	}

	errorRateColor := styles.SuccessStyle
	if errorRate > 5 {
		errorRateColor = styles.ErrorStyle
	} else if errorRate > 1 {
		errorRateColor = styles.WarningStyle
	}

	content := fmt.Sprintf(
		"%s\n\n%s\n\n%s %s",
		styles.CardTitleStyle.Render("📈 Status Codes"),
		statusLines,
		styles.CardLabelStyle.Render("Error Rate:"),
		errorRateColor.Render(fmt.Sprintf("%.2f%%", errorRate)),
	)

	return styles.CardStyle.Width(width).Render(content)
}