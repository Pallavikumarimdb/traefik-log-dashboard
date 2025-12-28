/**
 * Shared Chart.js configuration
 * Extracted to reduce duplication across chart components
 */

/**
 * Common Chart.js options shared across all charts
 */
export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    },
  },
} as const;

/**
 * Common tooltip configuration
 */
export const commonTooltipConfig = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  padding: 12,
  titleColor: '#fff',
  bodyColor: '#fff',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
} as const;

/**
 * Get safe CSS variable value with fallback
 */
export function getComputedStyleSafe(variableName: string, fallbackHsl: string): string {
  if (typeof window === 'undefined') return fallbackHsl;
  const root = getComputedStyle(document.documentElement);
  const value = root.getPropertyValue(variableName).trim();
  return value || fallbackHsl;
}

