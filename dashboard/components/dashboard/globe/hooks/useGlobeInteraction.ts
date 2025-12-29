import { useCallback, useRef, useState } from 'react'
import { useGlobeStore } from '../globeStore'

interface UseGlobeInteractionOptions {
  onLocationClick?: (location: { longitude: number; latitude: number }) => void
}

export function useGlobeInteraction(options: UseGlobeInteractionOptions = {}) {
  const { state, setRotation, setZoomLevel } = useGlobeStore()
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouse, setLastMouse] = useState<[number, number]>([0, 0])
  const svgRef = useRef<SVGSVGElement | null>(null)

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      setIsDragging(true)
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        setLastMouse([event.clientX - rect.left, event.clientY - rect.top])
      }
    },
    []
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging) return

      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return

      const currentMouse: [number, number] = [event.clientX - rect.left, event.clientY - rect.top]
      const dx = currentMouse[0] - lastMouse[0]
      const dy = currentMouse[1] - lastMouse[1]

      const t = state.progress / 100

      if (t < 0.5) {
        // Globe mode - rotate
        const sensitivity = 0.5
        setRotation([state.rotation[0] + dx * sensitivity, state.rotation[1] - dy * sensitivity])
      } else {
        // Map mode - rotate the projection
        const sensitivityMap = 0.25
        setRotation([state.rotation[0] + dx * sensitivityMap, state.rotation[1] - dy * sensitivityMap])
      }

      setLastMouse(currentMouse)
    },
    [isDragging, lastMouse, state.progress, state.rotation, setRotation]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      setZoomLevel(state.zoomLevel * delta)
    },
    [state.zoomLevel, setZoomLevel]
  )

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<SVGSVGElement>) => {
      if (event.touches.length === 1) {
        setIsDragging(true)
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          const touch = event.touches[0]
          setLastMouse([touch.clientX - rect.left, touch.clientY - rect.top])
        }
      }
    },
    []
  )

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<SVGSVGElement>) => {
      if (!isDragging || event.touches.length !== 1) return

      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return

      const touch = event.touches[0]
      const currentMouse: [number, number] = [touch.clientX - rect.left, touch.clientY - rect.top]
      const dx = currentMouse[0] - lastMouse[0]
      const dy = currentMouse[1] - lastMouse[1]

      const t = state.progress / 100

      if (t < 0.5) {
        const sensitivity = 0.5
        setRotation([state.rotation[0] + dx * sensitivity, state.rotation[1] - dy * sensitivity])
      } else {
        const sensitivityMap = 0.25
        setRotation([state.rotation[0] + dx * sensitivityMap, state.rotation[1] - dy * sensitivityMap])
      }

      setLastMouse(currentMouse)
    },
    [isDragging, lastMouse, state.progress, state.rotation, setRotation]
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const step = 10
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          setRotation([state.rotation[0] - step, state.rotation[1]])
          break
        case 'ArrowRight':
          event.preventDefault()
          setRotation([state.rotation[0] + step, state.rotation[1]])
          break
        case 'ArrowUp':
          event.preventDefault()
          setRotation([state.rotation[0], Math.max(-90, state.rotation[1] - step)])
          break
        case 'ArrowDown':
          event.preventDefault()
          setRotation([state.rotation[0], Math.min(90, state.rotation[1] + step)])
          break
        case '+':
        case '=':
          event.preventDefault()
          setZoomLevel(Math.min(8, state.zoomLevel * 1.1))
          break
        case '-':
        case '_':
          event.preventDefault()
          setZoomLevel(Math.max(0.5, state.zoomLevel / 1.1))
          break
      }
    },
    [state.rotation, state.zoomLevel, setRotation, setZoomLevel]
  )

  return {
    svgRef,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  }
}
