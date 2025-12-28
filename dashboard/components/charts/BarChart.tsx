'use client';

import React, { useRef, useEffect } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { commonTooltipConfig, getComputedStyleSafe } from '@/lib/utils/chart-config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		backgroundColor?: string | string[];
		borderColor?: string | string[];
		borderWidth?: number;
	}[];
	height?: number;
}

function BarChart({ labels, datasets, height = 300 }: BarChartProps) {
	const chartRef = useRef<ChartJS<'bar'>>(null);

	// MEMORY LEAK FIX: Cleanup chart instance on unmount
	useEffect(() => {
		return () => {
			if (chartRef.current) {
				chartRef.current.destroy();
				chartRef.current = null;
			}
		};
	}, []);

	const chartData = { labels, datasets };

	const grid = `hsla(${getComputedStyleSafe('--muted-foreground', '0 0 0')} / 0.1)`;

	// REDUNDANCY FIX: Use shared chart configuration
	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: datasets.length > 1, position: 'top' as const },
			tooltip: commonTooltipConfig,
		},
		scales: {
			x: { grid: { display: false } },
			y: { beginAtZero: true, grid: { color: grid }, ticks: { precision: 0 } },
		},
	};

	return (
		<div style={{ height }}>
			<Bar ref={chartRef} data={chartData} options={options} />
		</div>
	);
}

// BEST PRACTICE FIX: Memoize expensive chart component
export default React.memo(BarChart);