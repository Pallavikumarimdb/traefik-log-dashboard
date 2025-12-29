"use client"

import { Button } from "@/components/ui/button"
import { Plus, Minus, RotateCcw, Play, Pause } from "lucide-react"
import { useGlobeStore } from "../globeStore"

interface GlobeControlsProps {
  onAnimate?: () => void
  className?: string
}

export function GlobeControls({ onAnimate, className = "" }: GlobeControlsProps) {
  const { state, setZoomLevel, reset, setIsAnimating } = useGlobeStore()

  const handleZoomIn = () => {
    setZoomLevel(Math.min(8, state.zoomLevel * 1.2))
  }

  const handleZoomOut = () => {
    setZoomLevel(Math.max(0.5, state.zoomLevel / 1.2))
  }

  const handleReset = () => {
    reset()
  }

  const handleAnimate = () => {
    if (onAnimate) {
      onAnimate()
    }
  }

  const handlePause = () => {
    setIsAnimating(false)
  }

  return (
    <div className={`absolute bottom-4 right-4 flex flex-col items-end gap-2 z-10 ${className}`}>
      {/* Zoom Controls */}
      <div className="flex flex-col bg-white dark:bg-neutral-950 shadow-md rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-none hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {state.isAnimating ? (
          <Button
            onClick={handlePause}
            className="cursor-pointer min-w-[120px] rounded shadow-sm bg-yellow-600 hover:bg-yellow-700 text-white border-0"
            aria-label="Pause animation"
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </Button>
        ) : (
          <Button
            onClick={handleAnimate}
            disabled={state.isAnimating}
            className="cursor-pointer min-w-[120px] rounded shadow-sm bg-red-600 hover:bg-red-700 text-white border-0"
            aria-label={state.progress === 0 ? "Unroll globe to map" : "Roll map to globe"}
          >
            <Play className="w-4 h-4 mr-2" />
            {state.progress === 0 ? "Unroll Globe" : "Roll to Globe"}
          </Button>
        )}
        <Button
          onClick={handleReset}
          variant="outline"
          className="cursor-pointer min-w-[80px] hover:bg-neutral-100 bg-white dark:bg-black backdrop-blur-sm rounded shadow-sm border-neutral-200 dark:border-neutral-800"
          aria-label="Reset view"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}

