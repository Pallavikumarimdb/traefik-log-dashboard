'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { GeoLocation } from '@/lib/types';
import { MapPin } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';

interface Props {
  locations: GeoLocation[];
}

export default function InteractiveGeoMap({ locations }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || locations.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = svg.node()?.getBoundingClientRect().width || 800;
    const height = width * 0.5;
    svg.attr('height', height);

    const projection = d3.geoMercator().scale(width / 2 / Math.PI).translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);

    const maxCount = d3.max(locations, d => d.count) || 1;
    const radiusScale = d3.scaleSqrt().domain([1, maxCount]).range([2, 20]);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('visibility', 'hidden')
      .style('background', '#333')
      .style('color', '#fff')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px');

    d3.json('/world-map.json').then((world: any) => {
      svg.append('g')
        .selectAll('path')
        // ---- THIS IS THE CORRECTED LINE ----
        .data((topojson.feature(world, world.objects.countries) as any).features)
        .enter().append('path')
        .attr('d', d => path(d) as string)
        .attr('fill', 'hsl(var(--muted))')
        .attr('stroke', 'hsl(var(--background))');

      svg.append('g')
        .selectAll('circle')
        .data(locations.filter(d => d.longitude != null && d.latitude != null))
        .enter().append('circle')
        .attr('transform', d => `translate(${projection([d.longitude!, d.latitude!])})`)
        .attr('r', d => radiusScale(d.count))
        .attr('fill', 'hsl(var(--primary))')
        .attr('opacity', 0.6)
        .attr('stroke', 'hsl(var(--background))')
        .on('mouseover', (event, d) => {
          tooltip.style('visibility', 'visible').text(`${d.country}: ${d.count}`);
        })
        .on('mousemove', (event) => {
          tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', () => {
          tooltip.style('visibility', 'hidden');
        });
    });

    return () => {
      tooltip.remove();
    };
  }, [locations]);

  if (locations.length === 0) {
    return (
        <Card title="Geographic Distribution" icon={<MapPin className="w-5 h-5" />}>
            <div className="text-center py-8 text-muted-foreground">No geographic data available</div>
        </Card>
    );
  }

  return (
    <Card title="Geographic Distribution" icon={<MapPin className="w-5 h-5" />}>
        <svg ref={svgRef} width="100%"></svg>
    </Card>
  );
}