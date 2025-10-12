'use client';

import { Cpu, HardDrive, MemoryStick } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';

interface SystemStats {
  cpu: {
    usage_percent: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    used_percent: number;
    available: number;
  };
  disk: {
    total: number;
    used: number;
    used_percent: number;
    free: number;
  };
}

interface Props {
  stats: SystemStats | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getStatusColor(percent: number): string {
  if (percent >= 90) return 'text-red-600';
  if (percent >= 75) return 'text-yellow-600';
  return 'text-green-600';
}

function getProgressBarColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full ${getProgressBarColor(percent)} transition-all duration-300`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

export function CPUCard({ stats }: Props) {
  if (!stats || !stats.cpu) {
    return (
      <Card title="CPU" icon={<Cpu className="w-5 h-5 text-blue-600" />}>
        <div className="text-center text-gray-500 py-4">
          System monitoring disabled
        </div>
      </Card>
    );
  }

  const { cpu } = stats;
  const percent = cpu.usage_percent || 0;

  return (
    <Card title="CPU Usage" icon={<Cpu className="w-5 h-5 text-blue-600" />}>
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className={`text-4xl font-bold ${getStatusColor(percent)}`}>
            {percent.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 mb-1">
            {cpu.cores} {cpu.cores === 1 ? 'core' : 'cores'}
          </div>
        </div>
        
        <ProgressBar percent={percent} />
        
        <div className="text-xs text-gray-500">
          {percent >= 90 && '⚠️ High CPU usage'}
          {percent >= 75 && percent < 90 && '⚠️ Moderate CPU usage'}
          {percent < 75 && '✓ Normal'}
        </div>
      </div>
    </Card>
  );
}

export function MemoryCard({ stats }: Props) {
  if (!stats || !stats.memory) {
    return (
      <Card title="Memory" icon={<MemoryStick className="w-5 h-5 text-purple-600" />}>
        <div className="text-center text-gray-500 py-4">
          System monitoring disabled
        </div>
      </Card>
    );
  }

  const { memory } = stats;
  const percent = memory.used_percent || 0;

  return (
    <Card title="Memory Usage" icon={<MemoryStick className="w-5 h-5 text-purple-600" />}>
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className={`text-4xl font-bold ${getStatusColor(percent)}`}>
            {percent.toFixed(1)}%
          </div>
        </div>
        
        <ProgressBar percent={percent} />
        
        <div className="text-xs text-gray-600">
          <div>{formatBytes(memory.used)} / {formatBytes(memory.total)}</div>
          <div className="text-gray-500 mt-1">
            {formatBytes(memory.available)} available
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          {percent >= 90 && '⚠️ High memory usage'}
          {percent >= 75 && percent < 90 && '⚠️ Moderate memory usage'}
          {percent < 75 && '✓ Normal'}
        </div>
      </div>
    </Card>
  );
}

export function DiskCard({ stats }: Props) {
  if (!stats || !stats.disk) {
    return (
      <Card title="Disk" icon={<HardDrive className="w-5 h-5 text-indigo-600" />}>
        <div className="text-center text-gray-500 py-4">
          System monitoring disabled
        </div>
      </Card>
    );
  }

  const { disk } = stats;
  const percent = disk.used_percent || 0;

  return (
    <Card title="Disk Usage" icon={<HardDrive className="w-5 h-5 text-indigo-600" />}>
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className={`text-4xl font-bold ${getStatusColor(percent)}`}>
            {percent.toFixed(1)}%
          </div>
        </div>
        
        <ProgressBar percent={percent} />
        
        <div className="text-xs text-gray-600">
          <div>{formatBytes(disk.used)} / {formatBytes(disk.total)}</div>
          <div className="text-gray-500 mt-1">
            {formatBytes(disk.free)} free
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          {percent >= 90 && '❌ Critical - disk almost full'}
          {percent >= 80 && percent < 90 && '⚠️ High disk usage'}
          {percent < 80 && '✓ Normal'}
        </div>
      </div>
    </Card>
  );
}