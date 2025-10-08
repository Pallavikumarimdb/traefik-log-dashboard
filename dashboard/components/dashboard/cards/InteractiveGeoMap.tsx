'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { MapPin } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';

interface GeoLocation {
  country: string;
  latitude: number | null;
  longitude: number | null;
  count: number;
}

interface Props {
  locations: GeoLocation[];
}

interface TooltipData {
  country: string;
  count: number;
  x: number;
  y: number;
}

export default function InteractiveGeoMap({ locations }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || locations.length === 0) return;

    // Clear any previous renders
    d3.select(svgRef.current).selectAll('*').remove();
    setError(null);

    // Get container dimensions
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = width * 0.5;

    // Setup SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Setup projection
    const projection = d3.geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 1.5]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Setup scales
    const validLocations = locations.filter(
      d => d.longitude != null && d.latitude != null
    );
    const maxCount = d3.max(validLocations, d => d.count) || 1;
    const radiusScale = d3.scaleSqrt()
      .domain([1, maxCount])
      .range([3, 20]);

    // Load and render world map
    d3.json<any>('/world-map.json')
      .then(worldData => {
        if (!worldData || !worldData.objects || !worldData.objects.countries) {
          throw new Error('Invalid world map data');
        }

        // Extract features from TopoJSON
        const countries = topojson.feature(
          worldData,
          worldData.objects.countries
        );

        // Type guard to ensure we have a FeatureCollection
        if (countries.type !== 'FeatureCollection') {
          throw new Error('Expected FeatureCollection');
        }

        // Draw countries
        svg.append('g')
          .attr('class', 'countries')
          .selectAll('path')
          .data(countries.features)
          .join('path')
          .attr('d', feature => {
            const pathString = pathGenerator(feature);
            return pathString || '';
          })
          .attr('fill', 'hsl(var(--muted))')
          .attr('stroke', 'hsl(var(--border))')
          .attr('stroke-width', 0.5);

        // Draw location markers
        const markers = svg.append('g')
          .attr('class', 'markers')
          .selectAll('circle')
          .data(validLocations)
          .join('circle')
          .attr('cx', d => {
            const coords = projection([d.longitude!, d.latitude!]);
            return coords ? coords[0] : 0;
          })
          .attr('cy', d => {
            const coords = projection([d.longitude!, d.latitude!]);
            return coords ? coords[1] : 0;
          })
          .attr('r', d => radiusScale(d.count))
          .attr('fill', 'hsl(var(--primary))')
          .attr('fill-opacity', 0.7)
          .attr('stroke', 'hsl(var(--primary-foreground))')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event, d) {
            // Highlight the marker
            d3.select(this)
              .attr('fill-opacity', 1)
              .attr('stroke-width', 2);

            // Show tooltip
            const [x, y] = d3.pointer(event, document.body);
            setTooltip({
              country: d.country,
              count: d.count,
              x,
              y
            });
          })
          .on('mousemove', function(event) {
            const [x, y] = d3.pointer(event, document.body);
            setTooltip(prev => prev ? { ...prev, x, y } : null);
          })
          .on('mouseleave', function() {
            // Reset marker
            d3.select(this)
              .attr('fill-opacity', 0.7)
              .attr('stroke-width', 1.5);

            // Hide tooltip
            setTooltip(null);
          });

        // Add subtle animation on load
        markers
          .attr('r', 0)
          .transition()
          .duration(800)
          .delay((d, i) => i * 20)
          .attr('r', d => radiusScale(d.count));

      })
      .catch(err => {
        console.error('Error loading map data:', err);
        setError('Failed to load map data');
      });

    // Cleanup function
    return () => {
      setTooltip(null);
    };
  }, [locations]);

  if (locations.length === 0) {
    return (
      <Card title="Geographic Distribution" icon={<MapPin className="w-5 h-5" />}>
        <div className="text-center py-8 text-muted-foreground">
          No geographic data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Geographic Distribution" icon={<MapPin className="w-5 h-5" />}>
      <div ref={containerRef} className="relative w-full">
        {error ? (
          <div className="text-center py-8 text-destructive">
            {error}
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-auto" />
        )}
        
        {/* React-based tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y - 10}px`,
            }}
          >
            <div className="bg-popover text-popover-foreground border border-border rounded-md shadow-lg px-3 py-2 text-sm">
              <div className="font-semibold">{tooltip.country}</div>
              <div className="text-muted-foreground">
                {tooltip.count.toLocaleString()} request{tooltip.count !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}