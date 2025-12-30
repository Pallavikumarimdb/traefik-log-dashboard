/**
 * Shared chart configuration for Recharts
 * Centralized chart styling utilities
 */

/**
 * Common chart colors using CSS variables
 */
export const chartColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  border: 'hsl(var(--border))',
  foreground: 'hsl(var(--foreground))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',
} as const;

/**
 * Common tooltip styles for Recharts
 */
export const tooltipStyles = {
  contentStyle: {
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  labelStyle: {
    color: 'hsl(var(--foreground))',
    fontWeight: 500,
  },
  itemStyle: {
    color: 'hsl(var(--muted-foreground))',
  },
} as const;

/**
 * Common axis styles for Recharts
 */
export const axisStyles = {
  tick: {
    fill: 'hsl(var(--muted-foreground))',
    fontSize: 12,
  },
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
} as const;

/**
 * Common grid styles for Recharts
 */
export const gridStyles = {
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border))',
  vertical: false,
} as const;
