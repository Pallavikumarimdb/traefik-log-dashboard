// dashboard/components/AgentHealthDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAgents } from '@/lib/contexts/AgentContext';
import { useAgentHealth } from '@/lib/hooks/useAgentHealth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Server,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';

export default function AgentHealthDashboard() {
  const { agents } = useAgents();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    healthMetrics,
    isMonitoring,
    checkAllAgents,
    getOverallHealth,
    getUnhealthyAgents,
  } = useAgentHealth({
    checkInterval: 30000, // 30 seconds
    enableAutoCheck: autoRefresh,
    onStatusChange: (agentId, isOnline) => {
      console.log(`Agent ${agentId} status changed to ${isOnline ? 'online' : 'offline'}`);
    },
  });

  const overallHealth = getOverallHealth();
  const unhealthyAgents = getUnhealthyAgents();

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (isOnline: boolean) => {
    return isOnline ? (
      <Badge variant="default" className="bg-green-500 text-white">
        Online
      </Badge>
    ) : (
      <Badge variant="default" className="bg-red-500 text-white">
        Offline
      </Badge>
    );
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 1000) return 'text-green-600';
    if (responseTime < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <Badge variant="secondary">{overallHealth.totalAgents}</Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {overallHealth.totalAgents}
          </div>
          <div className="text-sm text-muted-foreground">Total Agents</div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <Badge variant="default" className="bg-green-500 text-white">
              {overallHealth.onlineAgents}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {overallHealth.onlineAgents}
          </div>
          <div className="text-sm text-muted-foreground">Online</div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <Badge variant="default" className="bg-red-500 text-white">
              {overallHealth.offlineAgents}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {overallHealth.offlineAgents}
          </div>
          <div className="text-sm text-muted-foreground">Offline</div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <Badge variant="secondary">{overallHealth.overallUptime.toFixed(1)}%</Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {overallHealth.overallUptime.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Overall Uptime</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Agent Health Metrics
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (30s)
          </label>
          <Button
            onClick={() => checkAllAgents()}
            variant="outline"
            size="sm"
            disabled={isMonitoring}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Unhealthy Agents Alert */}
      {unhealthyAgents.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                {unhealthyAgents.length} Unhealthy Agent(s) Detected
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200">
                The following agents are experiencing issues:
              </p>
              <ul className="mt-2 space-y-1">
                {unhealthyAgents.map((metric) => {
                  const agent = agents.find(a => a.id === metric.agentId);
                  return (
                    <li key={metric.agentId} className="text-sm text-red-800 dark:text-red-200">
                      • <strong>{agent?.name || metric.agentId}</strong>
                      {metric.error && ` - ${metric.error}`}
                      {metric.consecutiveFailures > 0 && ` (${metric.consecutiveFailures} consecutive failures)`}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Agent Health Table */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Failures
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {agents.map((agent) => {
                const health = healthMetrics[agent.id];
                if (!health) {
                  return (
                    <tr key={agent.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Server className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Agent #{agent.number}
                            </div>
                            <div className="text-sm text-muted-foreground">{agent.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" colSpan={5}>
                        <span className="text-sm text-muted-foreground">
                          Checking status...
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Server className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Agent #{agent.number}
                          </div>
                          <div className="text-sm text-muted-foreground">{agent.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {health.isOnline ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        {getStatusBadge(health.isOnline)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${getResponseTimeColor(health.responseTime)}`} />
                        <span className={`text-sm font-medium ${getResponseTimeColor(health.responseTime)}`}>
                          {health.responseTime}ms
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${getUptimeColor(health.uptime)}`} />
                        <span className={`text-sm font-medium ${getUptimeColor(health.uptime)}`}>
                          {health.uptime.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-muted-foreground">
                          {health.lastChecked.toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {health.consecutiveFailures > 0 ? (
                        <Badge variant="default" className="bg-red-500 text-white">
                          {health.consecutiveFailures}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">0</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Average Response Time Chart */}
      {Object.keys(healthMetrics).length > 0 && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Average Response Time: {overallHealth.averageResponseTime}ms
          </h4>
          <div className="space-y-3">
            {agents.map((agent) => {
              const health = healthMetrics[agent.id];
              if (!health) return null;

              const maxResponseTime = Math.max(
                ...Object.values(healthMetrics).map(h => h.responseTime)
              );
              const percentage = (health.responseTime / maxResponseTime) * 100;

              return (
                <div key={agent.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-900 dark:text-white">
                      Agent #{agent.number} - {agent.name}
                    </span>
                    <span className={`text-sm font-medium ${getResponseTimeColor(health.responseTime)}`}>
                      {health.responseTime}ms
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        health.responseTime < 1000
                          ? 'bg-green-500'
                          : health.responseTime < 3000
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}