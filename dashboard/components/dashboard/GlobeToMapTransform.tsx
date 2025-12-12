"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"
import { Button } from "@/components/ui/button"
import { GeoLocation } from "@/lib/types"

import { Plus, Minus } from "lucide-react"

interface GeoFeature {
  type: string
  geometry: any
  properties: any
}

interface Props {
  locations?: GeoLocation[]
}

function interpolateProjection(raw0: any, raw1: any) {
  const mutate: any = d3.geoProjectionMutator((t: number) => (x: number, y: number) => {
    const [x0, y0] = raw0(x, y)
    const [x1, y1] = raw1(x, y)
    return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)]
  })
  let t = 0
  return Object.assign((mutate as any)(t), {
    alpha(_: number) {
      return arguments.length ? (mutate as any)((t = +_)) : t
    },
  })
}

export function GlobeToMapTransform({ locations = [] }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState([0])
  const [worldData, setWorldData] = useState<GeoFeature[]>([])
  const [rotation, setRotation] = useState([0, 0])
  const [translation, setTranslation] = useState([0, 0])
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouse, setLastMouse] = useState([0, 0])
  const [zoomLevel, setZoomLevel] = useState(1)

  const width = 800
  const height = 500

  // Load world data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        // Using Natural Earth data from a CDN
        const response = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        const world: any = await response.json()
        const countries = (feature(world, world.objects.countries) as any).features
        setWorldData(countries)
        console.log("[v0] Successfully loaded world data with", countries.length, "countries")
      } catch (error) {
        console.log("[v0] Error loading world data:", error)
        // Fallback: create a simple world outline
        const fallbackData = [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
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
      }
    }

    loadWorldData()
  }, [])

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true)
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) {
      setLastMouse([event.clientX - rect.left, event.clientY - rect.top])
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentMouse = [event.clientX - rect.left, event.clientY - rect.top]
    const dx = currentMouse[0] - lastMouse[0]
    const dy = currentMouse[1] - lastMouse[1]

    const t = progress[0] / 100

    if (t < 0.5) {
      // Globe mode - rotate
      const sensitivity = 0.5
      // NOTE: flip horizontal sign so dragging right rotates globe to the right
      setRotation((prev) => [prev[0] + dx * sensitivity, Math.max(-90, Math.min(90, prev[1] - dy * sensitivity))])
    } else {
      // Map mode - rotate the projection (not simple pan)
      // This updates the projection.rotate(...) used when in equirectangular mode.
      const sensitivityMap = 0.25 // lower sensitivity for longitude/latitude rotation
      setRotation((prev) => [prev[0] + dx * sensitivityMap, Math.max(-90, Math.min(90, prev[1] - dy * sensitivityMap))])
    }

    setLastMouse(currentMouse)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Initialize and update visualization
  useEffect(() => {
    if (!svgRef.current || worldData.length === 0) return

    const svg = d3.select(svgRef.current)

    svg.selectAll("*").remove()

    const t = progress[0] / 100
    const alpha = Math.pow(t, 0.5) // Ease-out for smoother animation

    const scale = d3.scaleLinear().domain([0, 1]).range([200, 120])
    const baseRotate = d3.scaleLinear().domain([0, 1]).range([0, 0])

    const projection = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
      .scale(scale(alpha) * zoomLevel)
      .translate([width / 2 + translation[0], height / 2 + translation[1]])
      .rotate([baseRotate(alpha) + rotation[0], rotation[1]])
      .precision(0.1)

    // Set the interpolation parameter
    projection.alpha(alpha)

    // Create path generator
    const path = d3.geoPath(projection)

    // Add graticule (grid lines) above ocean fill but below countries
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
      console.log("[v0] Error creating graticule:", error)
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
          const pathString = path(d as any)
          if (!pathString) return ""
          if (typeof pathString === "string" && (pathString.includes("NaN") || pathString.includes("Infinity"))) {
            return ""
          }
          return pathString
        } catch (error) {
          console.log("[v0] Error generating path for country:", error)
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
    
    // Removed sphere outline to fix "black line/rectangle" artifact


    // Add locations
    if (locations && locations.length > 0) {
      const maxCount = Math.max(...locations.map(l => l.count));
      const radiusScale = d3.scaleSqrt().domain([0, maxCount]).range([2, 10]);

      svg.selectAll(".location-marker")
        .data(locations)
        .enter()
        .append("circle")
        .attr("class", "location-marker")
        .attr("cx", d => {
          const coords = projection([d.longitude || 0, d.latitude || 0]);
          return coords ? coords[0] : 0;
        })
        .attr("cy", d => {
          const coords = projection([d.longitude || 0, d.latitude || 0]);
          return coords ? coords[1] : 0;
        })
        .attr("r", d => radiusScale(d.count))
        .attr("fill", "rgba(220, 38, 38, 0.7)") // red-600 with opacity
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .style("visibility", function(d) {
           const coords = projection([d.longitude || 0, d.latitude || 0]);
           if (!coords) return "hidden";
           return "visible";
        })
        // Better handling for visibility on globe:
        .each(function(d) {
           if (alpha < 0.5) { // Globe mode
             const rotate = projection.rotate();
             const center = [-rotate[0], -rotate[1]];
             const distance = d3.geoDistance(
               [d.longitude || 0, d.latitude || 0],
               center as [number, number]
             );
             if (distance > Math.PI / 2) {
               d3.select(this).style("visibility", "hidden");
             }
           }
        });
    }

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 8])
      .on("zoom", (event) => {
         // D3 zoom event gives us a transform k (scale)
         // But we are managing state in React, so we just update the state.
         // However, standard d3 zoom handles panning too. We have custom rotation logic.
         // We only want 'wheel' events to affect scale.
         // If we use full d3.zoom it might conflict with our custom drag rotation.
         // So we just use it for wheel events essentially.
         setZoomLevel(event.transform.k)
      })
      // Disable click/drag (panning) from d3.zoom because we handle dragging for rotation
      // We only want the wheel/pinch behaviors
      .filter((event) => {
        return event.type === 'wheel' || event.type === 'dblclick';
      })

    // Apply current zoom transform so d3 internal state matches our react state
    // This is important so the next wheel event starts from correct scale
    svg.call(zoom as any)
    svg.call(zoom.transform as any, d3.zoomIdentity.scale(zoomLevel))

    // Cleanup
    return () => {
      svg.on(".zoom", null)
    }

  }, [worldData, progress, rotation, translation, locations, zoomLevel])

  const handleAnimate = () => {
    if (isAnimating) return

    setIsAnimating(true)
    const startProgress = progress[0]
    const endProgress = startProgress === 0 ? 100 : 0
    const duration = 2000

    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / duration, 1)

      // Smooth easing function
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const currentProgress = startProgress + (endProgress - startProgress) * eased

      setProgress([currentProgress])

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    animate()
  }

  const handleReset = () => {
    setRotation([0, 0])
    setTranslation([0, 0])
    setZoomLevel(1)
  }

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 8))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5))

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
        aria-label="Interactive Globe/Map Visualization"
      />
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-10">
        <div className="flex flex-col gap-1 bg-white/10 dark:bg-black/20 backdrop-blur-sm p-1 rounded-lg border border-neutral-200/20">
          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="icon"
            className="w-8 h-8 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="icon"
            className="w-8 h-8 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleAnimate} disabled={isAnimating} className="cursor-pointer min-w-[120px] rounded shadow-sm">
            {isAnimating ? "Animating..." : progress[0] === 0 ? "Unroll Globe" : "Roll to Globe"}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="cursor-pointer min-w-[80px] hover:bg-neutral-100 bg-white dark:bg-black backdrop-blur-sm rounded shadow-sm"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
