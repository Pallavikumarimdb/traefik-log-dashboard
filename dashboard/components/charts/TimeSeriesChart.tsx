'use client';

import React, { useRef, useEffect } from 'react';
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
import { commonTooltipConfig } from '@/lib/utils/chart-config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
}

function TimeSeriesChart({ data }: TimeSeriesChartProps) {
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

  const labels = data.map(point => {
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });

  const values = data.map(point => point.value);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Requests',
        data: values,
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  // REDUNDANCY FIX: Use shared chart configuration
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...commonTooltipConfig,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkipPadding: 20, color: '#6b7280' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { precision: 0, color: '#6b7280' },
      },
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
  };

  return <Line ref={chartRef} data={chartData} options={options} />;
}

// BEST PRACTICE FIX: Memoize expensive chart component
export default React.memo(TimeSeriesChart);