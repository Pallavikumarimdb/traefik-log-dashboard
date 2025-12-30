import * as d3 from 'd3'
import { GeoLocation } from '@/lib/types'

/**
 * Interpolates between two D3 projection functions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function interpolateProjection(raw0: any, raw1: any) {
  const mutate = d3.geoProjectionMutator((t: number) => (x: number, y: number) => {
    const [x0, y0] = raw0(x, y)
    const [x1, y1] = raw1(x, y)
    return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)]
  })
  let t = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projection = mutate() as any
  return Object.assign(projection, {
    alpha(_?: number) {
      if (arguments.length) {
        t = +(_ ?? 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return mutate() as any
      }
      return t
    },
  })
}

/**
 * Normalizes rotation values to valid ranges
 */
export function normalizeRotation(rotation: [number, number]): [number, number] {
  return [rotation[0], Math.max(-90, Math.min(90, rotation[1]))]
}

/**
 * Calculates if a location should be visible based on projection and mode
 */
export function calculateLocationVisibility(
  location: GeoLocation,
  projection: d3.GeoProjection,
  alpha: number
): boolean {
  if (!location.longitude || !location.latitude) return false

  const coords = projection([location.longitude, location.latitude])
  if (!coords) return false

  // In globe mode (alpha < 0.5), hide locations on the back side
  if (alpha < 0.5) {
    const rotate = projection.rotate()
    if (!rotate) return true
    const center: [number, number] = [-rotate[0], -rotate[1]]
    const distance = d3.geoDistance([location.longitude, location.latitude], center)
    return distance <= Math.PI / 2
  }

  return true
}

/**
 * Gets the projection scale based on the current mode (globe vs map)
 */
export function getProjectionScale(alpha: number, zoomLevel: number): number {
  const baseScale = d3.scaleLinear().domain([0, 1]).range([200, 120])
  return baseScale(alpha) * zoomLevel
}

/**
 * Formats a location label for display
 */
export function formatLocationLabel(location: GeoLocation): string {
  const parts: string[] = []
  if (location.city) parts.push(location.city)
  if (location.country) parts.push(location.country)
  return parts.join(', ') || 'Unknown Location'
}

/**
 * Generates a tooltip text for a location
 */
export function getLocationTooltipText(location: GeoLocation): string {
  const parts: string[] = []
  
  if (location.country) {
    parts.push(location.country)
  }
  if (location.city) {
    parts.push(location.city)
  }
  parts.push(`${location.count.toLocaleString()} requests`)
  
  if (location.latitude && location.longitude) {
    parts.push(`📍 ${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`)
  }
  
  return parts.join('\n')
}

/**
 * Calculates radius scale for location markers based on request counts
 */
export function getRadiusScale(locations: GeoLocation[]): d3.ScalePower<number, number, never> {
  if (locations.length === 0) {
    return d3.scaleSqrt().domain([0, 1]).range([2, 10])
  }
  const maxCount = Math.max(...locations.map((l) => l.count))
  return d3.scaleSqrt().domain([0, maxCount]).range([2, 10])
}

/**
 * Easing function for smooth animations
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

/**
 * Validates and sanitizes a path string from D3
 */
export function sanitizePath(pathString: string | null): string {
  if (!pathString) return ''
  if (typeof pathString === 'string' && (pathString.includes('NaN') || pathString.includes('Infinity'))) {
    return ''
  }
  return pathString
}

