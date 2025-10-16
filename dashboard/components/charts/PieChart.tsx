'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  labels: string[];
  data: number[];
  backgroundColor?: string[];
  height?: number;
}

export default function PieChart({ 
  labels, 
  data, 
  backgroundColor = [
    'rgba(0,0,0,0.85)',
    'rgba(0,0,0,0.65)',
    'rgba(0,0,0,0.45)',
    'rgba(0,0,0,0.25)',
    'rgba(0,0,0,0.15)',
    'rgba(0,0,0,0.05)'
  ],
  height = 300 
}: PieChartProps) {
  const chartRef = useRef<ChartJS<'pie'>>(null);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor: backgroundColor.map(color => color.replace(/0\.[0-9]+\)/, '1)')),
        borderWidth: 2,
      },
    ],
  };

  const tooltipBg = 'rgba(0, 0, 0, 0.8)';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Pie ref={chartRef} data={chartData} options={options} />
    </div>
  );
}