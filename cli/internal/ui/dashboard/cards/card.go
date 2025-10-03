package cards

import (
	"github.com/charmbracelet/lipgloss"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// Card represents a UI card component
type Card struct {
	Title   string
	Content string
	Width   int
	Height  int
}

// Render renders a card with title and content
func Render(title, content string, width int) string {
	titleStyle := styles.CardTitleStyle.Width(width - 4)
	
	contentStyle := lipgloss.NewStyle().
		Width(width - 4).
		Foreground(styles.Foreground)

	cardContent := lipgloss.JoinVertical(
		lipgloss.Left,
		titleStyle.Render(title),
		"",
		contentStyle.Render(content),
	)

	return styles.CardStyle.Width(width).Render(cardContent)
}

// RenderWithHeight renders a card with specified height
func RenderWithHeight(title, content string, width, height int) string {
	titleStyle := styles.CardTitleStyle.Width(width - 4)
	
	contentStyle := lipgloss.NewStyle().
		Width(width - 4).
		Height(height - 6).
		Foreground(styles.Foreground)

	cardContent := lipgloss.JoinVertical(
		lipgloss.Left,
		titleStyle.Render(title),
		"",
		contentStyle.Render(content),
	)

	return styles.CardStyle.Width(width).Height(height).Render(cardContent)
}