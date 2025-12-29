"use client"

import { useEffect, useRef, useMemo, useCallback } from "react"
import * as d3 from "d3"
import { GeoLocation } from "@/lib/types"
import { GlobeStoreProvider, useGlobeStore } from "./globe/globeStore"
import { useGlobeData } from "./globe/hooks/useGlobeData"
import { useGlobeInteraction } from "./globe/hooks/useGlobeInteraction"
import { GlobeControls } from "./globe/components/GlobeControls"
import {
  interpolateProjection,
  calculateLocationVisibility,
  getProjectionScale,
  getRadiusScale,
  sanitizePath,
  easeInOutQuad,
  getLocationTooltipText,
} from "./globe/globeUtils"

interface Props {
  locations?: GeoLocation[]
}

function GlobeToMapTransformInner({ locations = [] }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const { state, setProgress, setIsAnimating } = useGlobeStore()
  const { worldData } = useGlobeData()
  const {
    svgRef: interactionSvgRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  } = useGlobeInteraction()

  // Sync refs - update interaction hook's ref when our ref changes
  useEffect(() => {
    if (interactionSvgRef && svgRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(interactionSvgRef as any).current = svgRef.current
    }
  }, [interactionSvgRef])

  const width = 800
  const height = 500

  // Animation handler
  const handleAnimate = useCallback(() => {
    if (state.isAnimating) return

    setIsAnimating(true)
    const startProgress = state.progress
    const endProgress = startProgress === 0 ? 100 : 0
    const duration = 2000

    const startTime = Date.now()

    const animate = () => {
      if (!state.isAnimating && startProgress !== state.progress) {
        // Animation was paused or reset
        return
      }

      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / duration, 1)

      // Smooth easing function
      const eased = easeInOutQuad(t)
      const currentProgress = startProgress + (endProgress - startProgress) * eased

      setProgress(currentProgress)

      if (t < 1 && state.isAnimating) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    animate()
  }, [state.isAnimating, state.progress, setIsAnimating, setProgress])

  // Memoize projection calculation
  const projection = useMemo(() => {
    const t = state.progress / 100
    const alpha = Math.pow(t, 0.5) // Ease-out for smoother animation
    const scale = getProjectionScale(alpha, state.zoomLevel)

    const proj = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
      .scale(scale)
      .translate([width / 2 + state.translation[0], height / 2 + state.translation[1]])
      .rotate([state.rotation[0], state.rotation[1]])
      .precision(0.1)

    proj.alpha(alpha)
    return { projection: proj, alpha }
  }, [state.progress, state.zoomLevel, state.translation, state.rotation])

  // Memoize radius scale
  const radiusScale = useMemo(() => getRadiusScale(locations), [locations])

  // Initialize and update visualization
  useEffect(() => {
    if (!svgRef.current || worldData.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const { projection: proj, alpha } = projection
    const path = d3.geoPath(proj)

    // Add graticule (grid lines)
    try {
      const graticule = d3.geoGraticule()
      const graticulePath = path(graticule())
      if (graticulePath) {
        svg
          .append("path")
          .datum(graticule())
          .attr("d", graticulePath)
          .attr("fill", "none")
          .attr("stroke", "#cccccc")
          .attr("stroke-width", 1)
          .attr("opacity", 0.2)
      }
    } catch (error) {
      console.error("[Globe] Error creating graticule:", error)
    }

    // Add countries
    svg
      .selectAll(".country")
      .data(worldData)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", (d) => {
        try {
          const pathString = path(d as Parameters<typeof path>[0])
          return sanitizePath(pathString)
        } catch (error) {
          console.error("[Globe] Error generating path for country:", error)
          return ""
        }
      })
      .attr("fill", "none")
      .attr("stroke", "#cccccc")
      .attr("stroke-width", 1.0)
      .attr("opacity", 1.0)
      .style("visibility", function () {
        const pathData = d3.select(this).attr("d")
        return pathData && pathData.length > 0 && !pathData.includes("NaN") ? "visible" : "hidden"
      })

    // Add locations with tooltips
    if (locations && locations.length > 0) {
      let locationGroup = svg.select<SVGGElement>(".locations")
      if (locationGroup.empty()) {
        locationGroup = svg.append("g").attr("class", "locations")
      }

      const markers = locationGroup.selectAll<SVGCircleElement, GeoLocation>(".location-marker").data(locations)

      // Remove old markers
      markers.exit().remove()

      // Add new markers
      const markersEnter = markers
        .enter()
        .append("circle")
        .attr("class", "location-marker")
        .attr("fill", "rgba(220, 38, 38, 0.7)")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          // Show tooltip
          if (tooltipRef.current && svgRef.current) {
            tooltipRef.current.style.display = "block"
            tooltipRef.current.textContent = getLocationTooltipText(d)
            
            // Position tooltip near cursor - convert SVG coordinates to screen coordinates
            const svgRect = svgRef.current.getBoundingClientRect()
            const [x, y] = d3.pointer(event, svgRef.current)
            tooltipRef.current.style.left = `${svgRect.left + x + 10}px`
            tooltipRef.current.style.top = `${svgRect.top + y + 10}px`
          }
          
          // Highlight marker
          d3.select(this).attr("stroke-width", 2).attr("fill", "rgba(220, 38, 38, 0.9)")
        })
        .on("mousemove", function (event) {
          // Update tooltip position
          if (tooltipRef.current && svgRef.current) {
            const svgRect = svgRef.current.getBoundingClientRect()
            const [x, y] = d3.pointer(event, svgRef.current)
            tooltipRef.current.style.left = `${svgRect.left + x + 10}px`
            tooltipRef.current.style.top = `${svgRect.top + y + 10}px`
          }
        })
        .on("mouseleave", function () {
          // Hide tooltip
          if (tooltipRef.current) {
            tooltipRef.current.style.display = "none"
          }
          
          // Reset marker
          d3.select(this).attr("stroke-width", 1).attr("fill", "rgba(220, 38, 38, 0.7)")
        })

      // Update all markers (existing + new)
      markersEnter
        .merge(markers)
        .attr("cx", (d) => {
          const coords = proj([d.longitude || 0, d.latitude || 0])
          return coords ? coords[0] : 0
        })
        .attr("cy", (d) => {
          const coords = proj([d.longitude || 0, d.latitude || 0])
          return coords ? coords[1] : 0
        })
        .attr("r", (d) => radiusScale(d.count))
        .style("visibility", function (d) {
          return calculateLocationVisibility(d, proj, alpha) ? "visible" : "hidden"
        })
    }

    // Setup zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 8])
      .on("zoom", (event) => {
        // Zoom is handled by the interaction hook
        // This is just for D3's internal state
      })
      .filter((event) => {
        return event.type === "wheel" || event.type === "dblclick"
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    svg.call(zoom as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    svg.call((zoom.transform as any), d3.zoomIdentity.scale(state.zoomLevel))

    // Cleanup
    return () => {
      svg.on(".zoom", null)
    }
  }, [worldData, projection, locations, radiusScale])

  return (
    <div className="relative flex items-center justify-center w-full h-[500px]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full border rounded-lg bg-transparent border-neutral-800 cursor-grab active:cursor-grabbing"
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label="Interactive Globe/Map Visualization. Use arrow keys to rotate, +/- to zoom."
      />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed bg-neutral-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-20 shadow-lg whitespace-pre-line max-w-xs"
        style={{ display: "none" }}
        role="tooltip"
      />
      
      <GlobeControls onAnimate={handleAnimate} />
    </div>
  )
}

export function GlobeToMapTransform({ locations = [] }: Props) {
  return (
    <GlobeStoreProvider>
      <GlobeToMapTransformInner locations={locations} />
    </GlobeStoreProvider>
  )
}
