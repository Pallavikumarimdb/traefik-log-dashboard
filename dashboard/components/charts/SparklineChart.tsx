'use client';

import React, { useRef, useEffect } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getComputedStyleSafe } from '@/lib/utils/chart-config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

interface SparklineProps {
	data: number[];
	color?: string;
	height?: number;
}

function Sparkline({ data, color, height = 50 }: SparklineProps) {
	const chartRef = useRef<ChartJS<'line'>>(null);

	// MEMORY LEAK FIX: Cleanup chart instance on unmount
	useEffect(() => {
		return () => {
			if (chartRef.current) {
				chartRef.current.destroy();
				chartRef.current = null;
			}
		};
	}, []);

	const stroke = color || `hsl(${getComputedStyleSafe('--primary', '59 130 246')})`;
	const fill = color
		? color.replace('rgb', 'rgba').replace(')', ', 0.1)')
		: `hsla(${getComputedStyleSafe('--primary', '59 130 246')} / 0.1)`;

	const chartData = {
		labels: data.map((_, i) => i.toString()),
		datasets: [
			{
				data,
				borderColor: stroke,
				backgroundColor: fill,
				fill: true,
				tension: 0.4,
				pointRadius: 0,
				borderWidth: 2,
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			ooltip: { enabled: false },
		},
		scales: { x: { display: false }, y: { display: false } },
		interaction: { mode: 'nearest' as const, intersect: false },
	};

	return (
		<div style={{ height }}>
			<Line ref={chartRef} data={chartData} options={options} />
		</div>
	);
}

// BEST PRACTICE FIX: Memoize expensive chart component
export default React.memo(Sparkline);