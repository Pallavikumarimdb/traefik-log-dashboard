"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"
import { Button } from "@/components/ui/button"
import { GeoLocation } from "@/lib/types"

interface GeoFeature {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interpolateProjection(raw0: any, raw1: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mutate: any = d3.geoProjectionMutator((t: number) => (x: number, y: number) => {
    const [x0, y0] = raw0(x, y)
    const [x1, y1] = raw1(x, y)
    return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)]
  })
  let t = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.assign((mutate as any)(t), {
    alpha(_: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return arguments.length ? (mutate as any)((t = +_)) : t
    },
  })
}

interface Props {
  locations?: GeoLocation[]
}

export function GlobeToMapTransform({ locations = [] }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [progress, setProgress] = useState([0])
  const [worldData, setWorldData] = useState<GeoFeature[]>([])
  const [rotation, setRotation] = useState([0, 0])
  const [translation] = useState([0, 0])
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouse, setLastMouse] = useState([0, 0])
  const [isLoading, setIsLoading] = useState(true)

  const width = 800
  const height = 500

  // Load world data
  useEffect(() => {
    const loadWorldData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const world: any = await response.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const countries = (feature(world, world.objects.countries) as any).features
        setWorldData(countries)
      } catch (error) {
        console.error("[Globe] Error loading world data:", error)
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
      } finally {
        setIsLoading(false)
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
      setRotation((prev) => [prev[0] + dx * sensitivity, Math.max(-90, Math.min(90, prev[1] - dy * sensitivity))])
    } else {
      // Map mode - rotate the projection
      const sensitivityMap = 0.25
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
    const alpha = Math.pow(t, 0.5)

    const scale = d3.scaleLinear().domain([0, 1]).range([200, 120])
    const baseRotate = d3.scaleLinear().domain([0, 1]).range([0, 0])

    const projection = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
      .scale(scale(alpha))
      .translate([width / 2 + translation[0], height / 2 + translation[1]])
      .rotate([baseRotate(alpha) + rotation[0], rotation[1]])
      .precision(0.1)

    projection.alpha(alpha)

    const path = d3.geoPath(projection)

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
          .attr("stroke", "#94a3b8")
          .attr("stroke-width", 0.5)
          .attr("opacity", 0.3)
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pathString = path(d as any)
          if (!pathString) return ""
          if (typeof pathString === "string" && (pathString.includes("NaN") || pathString.includes("Infinity"))) {
            return ""
          }
          return pathString
        } catch {
          return ""
        }
      })
      .attr("fill", "#e2e8f0")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 0.5)
      .attr("opacity", 1.0)
      .style("visibility", function () {
        const pathData = d3.select(this).attr("d")
        return pathData && pathData.length > 0 && !pathData.includes("NaN") ? "visible" : "hidden"
      })

    // Add location markers if we have locations
    if (locations && locations.length > 0) {
      const validLocations = locations.filter(
        (loc) => loc.latitude && loc.longitude && loc.country !== "Unknown" && loc.country !== "Private"
      )

      if (validLocations.length > 0) {
        const maxCount = Math.max(...validLocations.map((l) => l.count))
        const radiusScale = d3.scaleSqrt().domain([0, maxCount]).range([3, 12])

        svg
          .selectAll(".location-marker")
          .data(validLocations)
          .enter()
          .append("circle")
          .attr("class", "location-marker")
          .attr("cx", (d) => {
            const coords = projection([d.longitude || 0, d.latitude || 0])
            return coords ? coords[0] : 0
          })
          .attr("cy", (d) => {
            const coords = projection([d.longitude || 0, d.latitude || 0])
            return coords ? coords[1] : 0
          })
          .attr("r", (d) => radiusScale(d.count))
          .attr("fill", "rgba(220, 38, 38, 0.7)")
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .style("visibility", (d) => {
            // Hide markers on back side of globe
            if (alpha < 0.5) {
              const center: [number, number] = [-rotation[0], -rotation[1]]
              const distance = d3.geoDistance([d.longitude || 0, d.latitude || 0], center)
              return distance <= Math.PI / 2 ? "visible" : "hidden"
            }
            return "visible"
          })
          .append("title")
          .text((d) => `${d.country}${d.city ? ` - ${d.city}` : ""}: ${d.count.toLocaleString()} requests`)
      }
    }

    // Draw sphere outline
    try {
      const sphereOutline = path({ type: "Sphere" })
      if (sphereOutline) {
        svg
          .append("path")
          .datum({ type: "Sphere" })
          .attr("d", sphereOutline)
          .attr("fill", "none")
          .attr("stroke", "#64748b")
          .attr("stroke-width", 1)
          .attr("opacity", 1.0)
      }
    } catch (error) {
      console.error("[Globe] Error creating sphere outline:", error)
    }
  }, [worldData, progress, rotation, translation, locations])

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
  }

  if (isLoading) {
    return (
      <div className="relative flex items-center justify-center w-full h-[500px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
          <span className="text-sm">Loading map data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center w-full h-[500px]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full border rounded-lg bg-slate-50 dark:bg-slate-900 border-border cursor-grab active:cursor-grabbing"
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
        <Button
          onClick={handleAnimate}
          disabled={isAnimating}
          size="sm"
          className="min-w-[100px]"
        >
          {isAnimating ? "Animating..." : progress[0] === 0 ? "Unroll Globe" : "Roll to Globe"}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
