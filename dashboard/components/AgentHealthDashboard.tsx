// dashboard/components/AgentHealthDashboard.tsx
'use client';

import { useState } from 'react';
import { useAgents } from '@/lib/contexts/AgentContext';
import { useAgentHealth } from '@/lib/hooks/useAgentHealth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
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

  const getStatusBadge = (isOnline: boolean) => {
    return isOnline ? (
      <Badge className="bg-green-500 text-white">Online</Badge>
    ) : (
      <Badge className="bg-red-500 text-white">Offline</Badge>
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
        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm hover:border-red-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-5 h-5 text-gray-600" />
            <Badge variant="secondary">{overallHealth.totalAgents}</Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {overallHealth.totalAgents}
          </div>
          <div className="text-sm text-gray-600">Total Agents</div>
        </div>

        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm hover:border-red-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <Badge className="bg-green-500 text-white">{overallHealth.onlineAgents}</Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {overallHealth.onlineAgents}
          </div>
          <div className="text-sm text-gray-600">Online</div>
        </div>

        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm hover:border-red-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <Badge className="bg-red-500 text-white">{overallHealth.offlineAgents}</Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {overallHealth.offlineAgents}
          </div>
          <div className="text-sm text-gray-600">Offline</div>
        </div>

        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm hover:border-red-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <Badge variant="secondary">{overallHealth.overallUptime.toFixed(1)}%</Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {overallHealth.overallUptime.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Overall Uptime</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Agent Health Metrics
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                {unhealthyAgents.length} Unhealthy Agent(s) Detected
              </h4>
              <p className="text-sm text-red-700">
                The following agents are experiencing issues:
              </p>
              <ul className="mt-2 space-y-1">
                {unhealthyAgents.map((metric) => {
                  const agent = agents.find(a => a.id === metric.agentId);
                  return (
                    <li key={metric.agentId} className="text-sm text-red-700">
                      • <span className="font-medium">{agent?.name || metric.agentId}</span>
                      {!metric.isOnline && ' - Offline'}
                      {metric.consecutiveFailures > 0 && ` - ${metric.consecutiveFailures} consecutive failures`}
                      {metric.responseTime > 5000 && ` - High response time (${metric.responseTime}ms)`}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Agent Details Table */}
      <div className="bg-white border border-red-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-50 border-b border-red-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Failures
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No agents configured
                  </td>
                </tr>
              ) : (
                agents.map((agent) => {
                  const metric = healthMetrics[agent.id];
                  return (
                    <tr key={agent.id} className="hover:bg-red-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Server className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {agent.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {agent.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {metric ? (
                          getStatusBadge(metric.isOnline)
                        ) : (
                          <Badge variant="secondary">Unknown</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {metric ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm font-medium ${getResponseTimeColor(metric.responseTime)}`}>
                              {metric.responseTime}ms
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {metric ? (
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm font-medium ${getUptimeColor(metric.uptime)}`}>
                              {metric.uptime.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {metric ? (
                          <span className="text-sm text-gray-600">
                            {metric.lastChecked.toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {metric ? (
                          <span className={`text-sm font-medium ${metric.consecutiveFailures > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {metric.consecutiveFailures}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Average Response Time Chart */}
      {agents.length > 0 && Object.keys(healthMetrics).length > 0 && (
        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Average Response Time: {overallHealth.averageResponseTime}ms
          </h4>
          <div className="space-y-3">
            {agents.map((agent) => {
              const metric = healthMetrics[agent.id];
              if (!metric) return null;

              const maxResponseTime = Math.max(
                ...Object.values(healthMetrics).map(m => m.responseTime),
                1000
              );
              const percentage = (metric.responseTime / maxResponseTime) * 100;

              return (
                <div key={agent.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {agent.name}
                    </span>
                    <span className={`text-sm font-semibold ${getResponseTimeColor(metric.responseTime)}`}>
                      {metric.responseTime}ms
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.responseTime < 1000
                          ? 'bg-green-500'
                          : metric.responseTime < 3000
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