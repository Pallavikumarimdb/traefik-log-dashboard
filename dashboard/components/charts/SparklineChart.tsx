'use client';

import { useRef } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

interface SparklineProps {
	data: number[];
	color?: string;
	height?: number;
}

export default function Sparkline({ data, color, height = 50 }: SparklineProps) {
	const chartRef = useRef<ChartJS<'line'>>(null);

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

function getComputedStyleSafe(variableName: string, fallbackHsl: string): string {
	if (typeof window === 'undefined') return fallbackHsl;
	const root = getComputedStyle(document.documentElement);
	const value = root.getPropertyValue(variableName).trim();
	return value || fallbackHsl;
}