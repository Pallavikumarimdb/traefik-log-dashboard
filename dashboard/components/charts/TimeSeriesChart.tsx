'use client';

import { useRef } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TimeSeriesPoint } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TimeSeriesChartProps {
	data: TimeSeriesPoint[];
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
	const chartRef = useRef<ChartJS<'line'>>(null);

	const labels = data.map(point => {
		const date = new Date(point.timestamp);
		return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
	});

	const values = data.map(point => point.value);

	// Use CSS variables for consistent theming
	const stroke = getComputedStyleSafe('--primary', '59 130 246');
	const grid = getComputedStyleSafe('--muted-foreground', '0 0 0');
	const tooltipBg = 'rgba(0, 0, 0, 0.8)';

	const chartData = {
		labels,
		datasets: [
			{
				label: 'Requests',
				data: values,
				borderColor: `hsl(${stroke})`,
				backgroundColor: `hsla(${stroke} / 0.1)`,
				fill: true,
				tension: 0.4,
				pointRadius: 0,
				pointHoverRadius: 4,
				borderWidth: 2,
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				mode: 'index' as const,
				intersect: false,
				backgroundColor: tooltipBg,
				padding: 12,
				titleColor: '#fff',
				bodyColor: '#fff',
				borderColor: 'rgba(255, 255, 255, 0.1)',
				borderWidth: 1,
			},
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: { maxRotation: 0, autoSkipPadding: 20 },
			},
			y: {
				beginAtZero: true,
				grid: { color: `hsla(${grid} / 0.1)` },
				ticks: { precision: 0 },
			},
		},
		interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
	};

	return <Line ref={chartRef} data={chartData} options={options} />;
}

function getComputedStyleSafe(variableName: string, fallbackHsl: string): string {
	if (typeof window === 'undefined') return fallbackHsl;
	const root = getComputedStyle(document.documentElement);
	const value = root.getPropertyValue(variableName).trim();
	return value || fallbackHsl;
}