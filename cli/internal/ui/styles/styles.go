package styles

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// Color palette
var (
	Primary    = lipgloss.Color("#3B82F6") // Blue
	Success    = lipgloss.Color("#10B981") // Green
	Warning    = lipgloss.Color("#F59E0B") // Yellow
	Error      = lipgloss.Color("#EF4444") // Red
	Muted      = lipgloss.Color("#6B7280") // Gray
	Background = lipgloss.Color("#1F2937") // Dark gray
	Foreground = lipgloss.Color("#F9FAFB") // Light gray
)

// Base styles
var (
	TitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(Primary).
			MarginBottom(1)

	SubtitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(Foreground).
			MarginBottom(1)

	DefaultStyle = lipgloss.NewStyle().
			Foreground(Foreground)

	MutedStyle = lipgloss.NewStyle().
			Foreground(Muted)

	SuccessStyle = lipgloss.NewStyle().
			Foreground(Success).
			Bold(true)

	WarningStyle = lipgloss.NewStyle().
			Foreground(Warning).
			Bold(true)

	ErrorStyle = lipgloss.NewStyle().
			Foreground(Error).
			Bold(true)

	SelectedStyle = lipgloss.NewStyle().
			Background(Primary).
			Foreground(lipgloss.Color("#FFFFFF")).
			Bold(true).
			Padding(0, 1)

	AccentStyle = lipgloss.NewStyle().
			Foreground(Primary)
)

// Card styles
var (
	CardStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(Muted).
			Padding(1, 2).
			MarginBottom(1)

	CardTitleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(Primary).
			MarginBottom(1)

	// FIX: Removed invalid FontSize call. Bold is used for emphasis.
	CardValueStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(Foreground)

	// FIX: Removed invalid FontSize call.
	CardLabelStyle = lipgloss.NewStyle().
			Foreground(Muted)
)

// Metric styles
var (
	MetricStyle = lipgloss.NewStyle().
			Padding(1, 2).
			Border(lipgloss.NormalBorder()).
			BorderForeground(Muted)

	MetricLabelStyle = lipgloss.NewStyle().
			Foreground(Muted).
			MarginRight(1)

	MetricValueStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(Primary)
)

// Table styles
var (
	TableHeaderStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(Primary).
				BorderBottom(true).
				BorderStyle(lipgloss.NormalBorder()).
				BorderForeground(Muted)

	TableRowStyle = lipgloss.NewStyle().
			Padding(0, 1)

	TableCellStyle = lipgloss.NewStyle().
			Padding(0, 1)
)

// Progress bar styles
var (
	ProgressBarStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(Muted).
				Padding(0, 1)

	ProgressFillStyle = lipgloss.NewStyle().
				Background(Primary)
)

// Status badge styles
var (
	Status2xxStyle = lipgloss.NewStyle().
			Background(Success).
			Foreground(lipgloss.Color("#FFFFFF")).
			Padding(0, 1).
			Bold(true)

	Status3xxStyle = lipgloss.NewStyle().
			Background(Primary).
			Foreground(lipgloss.Color("#FFFFFF")).
			Padding(0, 1).
			Bold(true)

	Status4xxStyle = lipgloss.NewStyle().
			Background(Warning).
			Foreground(lipgloss.Color("#FFFFFF")).
			Padding(0, 1).
			Bold(true)

	Status5xxStyle = lipgloss.NewStyle().
			Background(Error).
			Foreground(lipgloss.Color("#FFFFFF")).
			Padding(0, 1).
			Bold(true)
)

// Helper functions

// FIX: Replaced with a correct and simpler implementation.
// FormatNumber formats an integer with thousand separators.
func FormatNumber(n int) string {
	if n < 1000 {
		return fmt.Sprintf("%d", n)
	}

	if n < 1000000 {
		return fmt.Sprintf("%d,%03d", n/1000, n%1000)
	}

	return fmt.Sprintf("%d,%03d,%03d", n/1000000, (n%1000000)/1000, n%1000)
}

// ProgressBar creates a progress bar
func ProgressBar(percent float64, width int) string {
	filled := int(float64(width) * percent / 100)
	if filled > width {
		filled = width
	} else if filled < 0 {
		filled = 0
	}
	empty := width - filled

	bar := strings.Repeat("█", filled) + strings.Repeat("░", empty)
	return ProgressFillStyle.Render(bar[:filled]) + MutedStyle.Render(bar[filled:])
}

// StatusBadge creates a status badge based on HTTP status code
func StatusBadge(status int) string {
	switch {
	case status >= 200 && status < 300:
		return Status2xxStyle.Render("2xx")
	case status >= 300 && status < 400:
		return Status3xxStyle.Render("3xx")
	case status >= 400 && status < 500:
		return Status4xxStyle.Render("4xx")
	case status >= 500 && status < 600:
		return Status5xxStyle.Render("5xx")
	default:
		return MutedStyle.Render("???")
	}
}