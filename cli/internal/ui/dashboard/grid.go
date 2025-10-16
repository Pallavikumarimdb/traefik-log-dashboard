package dashboard

import (
	"github.com/charmbracelet/lipgloss"
)

// Grid represents a layout grid
type Grid struct {
	width   int
	height  int
	columns int
	rows    int
	gap     int
}

// NewGrid creates a new grid layout
func NewGrid(width, height, columns, rows, gap int) *Grid {
	return &Grid{
		width:   width,
		height:  height,
		columns: columns,
		rows:    rows,
		gap:     gap,
	}
}

// CellWidth calculates the width of each cell
func (g *Grid) CellWidth() int {
	totalGap := g.gap * (g.columns - 1)
	return (g.width - totalGap) / g.columns
}

// CellHeight calculates the height of each cell
func (g *Grid) CellHeight() int {
	totalGap := g.gap * (g.rows - 1)
	return (g.height - totalGap) / g.rows
}

// RenderRow renders a horizontal row of cells
func RenderRow(cells []string, gap int) string {
	if len(cells) == 0 {
		return ""
	}

	if len(cells) == 1 {
		return cells[0]
	}

	gapStr := lipgloss.NewStyle().Width(gap).Render(" ")
	
	result := cells[0]
	for i := 1; i < len(cells); i++ {
		result = lipgloss.JoinHorizontal(lipgloss.Top, result, gapStr, cells[i])
	}

	return result
}

// RenderColumn renders a vertical column of cells
func RenderColumn(cells []string, gap int) string {
	if len(cells) == 0 {
		return ""
	}

	if len(cells) == 1 {
		return cells[0]
	}

	gapStr := lipgloss.NewStyle().Height(gap).Render("\n")
	
	result := cells[0]
	for i := 1; i < len(cells); i++ {
		result = lipgloss.JoinVertical(lipgloss.Left, result, gapStr, cells[i])
	}

	return result
}

// RenderGrid renders a 2D grid of cells
func RenderGrid(cells [][]string, gap int) string {
	if len(cells) == 0 {
		return ""
	}

	rows := make([]string, len(cells))
	for i, row := range cells {
		rows[i] = RenderRow(row, gap)
	}

	return RenderColumn(rows, gap)
}