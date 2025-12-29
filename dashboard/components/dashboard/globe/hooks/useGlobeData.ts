import { useEffect, useState, useCallback } from 'react'
import { feature } from 'topojson-client'
import type { GeoFeature } from '../globeStore'
import { useGlobeStore } from '../globeStore'

// Cache for world data to avoid re-fetching
let cachedWorldData: GeoFeature[] | null = null
let isLoadingCache = false

export function useGlobeData() {
  const { state, setWorldData, setIsLoadingWorldData } = useGlobeStore()
  const [error, setError] = useState<Error | null>(null)

  const loadWorldData = useCallback(async () => {
    // Return cached data if available
    if (cachedWorldData && cachedWorldData.length > 0) {
      setWorldData(cachedWorldData)
      return
    }

    // Prevent multiple simultaneous loads
    if (isLoadingCache) {
      return
    }

    isLoadingCache = true
    setIsLoadingWorldData(true)
    setError(null)

    try {
      // Using Natural Earth data from a CDN
      const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      
      if (!response.ok) {
        throw new Error(`Failed to load world data: ${response.statusText}`)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const world: any = await response.json()
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countries = (feature(world, world.objects.countries) as any).features as GeoFeature[]
      
      // Cache the data
      cachedWorldData = countries
      setWorldData(countries)
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Globe] Successfully loaded world data with', countries.length, 'countries')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error loading world data')
      console.error('[Globe] Error loading world data:', error)
      setError(error)
      
      // Fallback: create a simple world outline
      const fallbackData: GeoFeature[] = [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-180, -90],
                [180, -90],
                [180, 90],
                [-180, 90],
                [-180, -90],
              ],
            ],
          },
          properties: {},
        },
      ]
      
      setWorldData(fallbackData)
    } finally {
      setIsLoadingWorldData(false)
      isLoadingCache = false
    }
  }, [setWorldData, setIsLoadingWorldData])

  useEffect(() => {
    // Only load if we don't have data yet
    if (state.worldData.length === 0 && !state.isLoadingWorldData) {
      loadWorldData()
    }
  }, [state.worldData.length, state.isLoadingWorldData, loadWorldData])

  return {
    worldData: state.worldData,
    isLoading: state.isLoadingWorldData,
    error,
    reload: loadWorldData,
  }
}

