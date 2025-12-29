"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { GeoLocation } from '@/lib/types'

export interface GlobeState {
  // View mode: 0 = globe, 100 = map
  progress: number
  // Rotation [longitude, latitude]
  rotation: [number, number]
  // Translation [x, y]
  translation: [number, number]
  // Zoom level
  zoomLevel: number
  // Animation state
  isAnimating: boolean
  // World data loading state
  isLoadingWorldData: boolean
  // Selected location
  selectedLocation: GeoLocation | null
  // World data
  worldData: GeoFeature[]
}

export interface GeoFeature {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any
}

interface GlobeStoreContextType {
  state: GlobeState
  setProgress: (progress: number) => void
  setRotation: (rotation: [number, number]) => void
  setTranslation: (translation: [number, number]) => void
  setZoomLevel: (zoomLevel: number) => void
  setIsAnimating: (isAnimating: boolean) => void
  setIsLoadingWorldData: (isLoading: boolean) => void
  setSelectedLocation: (location: GeoLocation | null) => void
  setWorldData: (data: GeoFeature[]) => void
  reset: () => void
}

const initialState: GlobeState = {
  progress: 0,
  rotation: [0, 0],
  translation: [0, 0],
  zoomLevel: 1,
  isAnimating: false,
  isLoadingWorldData: false,
  selectedLocation: null,
  worldData: [],
}

const GlobeStoreContext = createContext<GlobeStoreContextType | undefined>(undefined)

export function GlobeStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GlobeState>(initialState)

  const setProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, progress: Math.max(0, Math.min(100, progress)) }))
  }, [])

  const setRotation = useCallback((rotation: [number, number]) => {
    setState((prev) => ({
      ...prev,
      rotation: [rotation[0], Math.max(-90, Math.min(90, rotation[1]))],
    }))
  }, [])

  const setTranslation = useCallback((translation: [number, number]) => {
    setState((prev) => ({ ...prev, translation }))
  }, [])

  const setZoomLevel = useCallback((zoomLevel: number) => {
    setState((prev) => ({
      ...prev,
      zoomLevel: Math.max(0.5, Math.min(8, zoomLevel)),
    }))
  }, [])

  const setIsAnimating = useCallback((isAnimating: boolean) => {
    setState((prev) => ({ ...prev, isAnimating }))
  }, [])

  const setIsLoadingWorldData = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoadingWorldData: isLoading }))
  }, [])

  const setSelectedLocation = useCallback((location: GeoLocation | null) => {
    setState((prev) => ({ ...prev, selectedLocation: location }))
  }, [])

  const setWorldData = useCallback((data: GeoFeature[]) => {
    setState((prev) => ({ ...prev, worldData: data }))
  }, [])

  const reset = useCallback(() => {
    setState({
      ...initialState,
      worldData: state.worldData, // Keep world data
    })
  }, [state.worldData])

  const value: GlobeStoreContextType = {
    state,
    setProgress,
    setRotation,
    setTranslation,
    setZoomLevel,
    setIsAnimating,
    setIsLoadingWorldData,
    setSelectedLocation,
    setWorldData,
    reset,
  }

  return <GlobeStoreContext.Provider value={value}>{children}</GlobeStoreContext.Provider>
}

export function useGlobeStore() {
  const context = useContext(GlobeStoreContext)
  if (context === undefined) {
    throw new Error('useGlobeStore must be used within a GlobeStoreProvider')
  }
  return context
}

