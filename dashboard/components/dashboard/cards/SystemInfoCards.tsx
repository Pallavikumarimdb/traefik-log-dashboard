'use client';

import { Cpu, HardDrive, MemoryStick } from 'lucide-react';
import Card from '@/components/ui/DashboardCard';

interface SystemStats {
  cpu: {
    usage_percent: number;
    cores: number;
    model?: string;
    speed?: number;
  };
  memory: {
    total: number;
    used: number;
    used_percent: number;
    available: number;
    free?: number;
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
  if (!bytes || bytes === 0) return '0 B';
  if (isNaN(bytes)) return 'N/A';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getStatusColor(percent: number): string {
  if (isNaN(percent)) return 'text-gray-600';
  if (percent >= 90) return 'text-red-600';
  if (percent >= 75) return 'text-yellow-600';
  return 'text-green-600';
}

function getProgressBarColor(percent: number): string {
  if (isNaN(percent)) return 'bg-gray-500';
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

function ProgressBar({ percent }: { percent: number }) {
  const safePercent = isNaN(percent) ? 0 : Math.min(100, Math.max(0, percent));
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full ${getProgressBarColor(safePercent)} transition-all duration-300`}
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
}

export function CPUCard({ stats }: Props) {
  // Check if stats exist and have valid CPU data
  if (!stats?.cpu || typeof stats.cpu.usage_percent !== 'number') {
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
  const cores = cpu.cores || 0;

  return (
    <Card title="CPU Usage" icon={<Cpu className="w-5 h-5 text-blue-600" />}>
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className={`text-4xl font-bold ${getStatusColor(percent)}`}>
            {percent.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 mb-1">
            {cores} {cores === 1 ? 'core' : 'cores'}
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
  // Check if stats exist and have valid memory data
  if (!stats?.memory || typeof stats.memory.used_percent !== 'number') {
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
  const used = memory.used || 0;
  const total = memory.total || 0;
  const available = memory.available || 0;

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
          <div>{formatBytes(used)} / {formatBytes(total)}</div>
          <div className="text-gray-500 mt-1">
            {formatBytes(available)} available
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
  // Check if stats exist and have valid disk data
  if (!stats?.disk || typeof stats.disk.used_percent !== 'number') {
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
  const used = disk.used || 0;
  const total = disk.total || 0;
  const free = disk.free || 0;

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
          <div>{formatBytes(used)} / {formatBytes(total)}</div>
          <div className="text-gray-500 mt-1">
            {formatBytes(free)} free
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