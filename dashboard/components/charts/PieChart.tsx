'use client';

import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { commonTooltipConfig } from '@/lib/utils/chart-config';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  labels: string[];
  data: number[];
  backgroundColor?: string[];
  height?: number;
}

function PieChart({ 
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

  // MEMORY LEAK FIX: Cleanup chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

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

  // REDUNDANCY FIX: Use shared chart configuration
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
        ...commonTooltipConfig,
        callbacks: {
          label: function(context: { label?: string; parsed?: number; dataset: { data: number[] } }) {
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

// BEST PRACTICE FIX: Memoize expensive chart component
export default React.memo(PieChart);