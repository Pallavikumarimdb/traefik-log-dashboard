// dashboard/lib/hooks/useAgentHealth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Agent } from '../types/agent';
import { useAgents } from '../contexts/AgentContext';

interface AgentHealthMetrics {
  agentId: string;
  isOnline: boolean;
  responseTime: number; // in milliseconds
  lastChecked: Date;
  consecutiveFailures: number;
  uptime: number; // percentage over monitoring period
  error?: string;
}

interface HealthMonitorOptions {
  checkInterval?: number; // milliseconds between checks
  enableAutoCheck?: boolean;
  onStatusChange?: (agentId: string, isOnline: boolean) => void;
}

export function useAgentHealth(options: HealthMonitorOptions = {}) {
  const {
    checkInterval = 30000, // 30 seconds default
    enableAutoCheck = true,
    onStatusChange,
  } = options;

  const { agents, checkAgentStatus } = useAgents();
  const [healthMetrics, setHealthMetrics] = useState<Record<string, AgentHealthMetrics>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  const checkSingleAgent = useCallback(async (agent: Agent): Promise<AgentHealthMetrics> => {
    const startTime = Date.now();
    let isOnline = false;
    let error: string | undefined;

    try {
      isOnline = await checkAgentStatus(agent.id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;

    return {
      agentId: agent.id,
      isOnline,
      responseTime,
      lastChecked: new Date(),
      consecutiveFailures: isOnline ? 0 : (healthMetrics[agent.id]?.consecutiveFailures || 0) + 1,
      uptime: calculateUptime(agent.id, isOnline),
      error,
    };
  }, [checkAgentStatus, healthMetrics]);

  const calculateUptime = (agentId: string, currentStatus: boolean): number => {
    const current = healthMetrics[agentId];
    if (!current) return currentStatus ? 100 : 0;

    // Simple uptime calculation based on recent checks
    // In production, you might want to store historical data
    const totalChecks = current.consecutiveFailures + 1;
    const successfulChecks = currentStatus ? totalChecks - current.consecutiveFailures : totalChecks - current.consecutiveFailures - 1;
    
    return (successfulChecks / totalChecks) * 100;
  };

  const checkAllAgents = useCallback(async () => {
    setIsMonitoring(true);

    const results = await Promise.all(
      agents.map(agent => checkSingleAgent(agent))
    );

    const newMetrics: Record<string, AgentHealthMetrics> = {};
    results.forEach(metric => {
      newMetrics[metric.agentId] = metric;

      // Trigger status change callback if status changed
      const previousStatus = healthMetrics[metric.agentId]?.isOnline;
      if (previousStatus !== undefined && previousStatus !== metric.isOnline && onStatusChange) {
        onStatusChange(metric.agentId, metric.isOnline);
      }
    });

    setHealthMetrics(newMetrics);
    setIsMonitoring(false);
  }, [agents, checkSingleAgent, healthMetrics, onStatusChange]);

  // Auto-check setup
  useEffect(() => {
    if (!enableAutoCheck) return;

    // Initial check
    checkAllAgents();

    // Set up interval
    const interval = setInterval(checkAllAgents, checkInterval);

    return () => clearInterval(interval);
  }, [enableAutoCheck, checkInterval, checkAllAgents]);

  const getAgentHealth = (agentId: string): AgentHealthMetrics | null => {
    return healthMetrics[agentId] || null;
  };

  const getOverallHealth = (): {
    totalAgents: number;
    onlineAgents: number;
    offlineAgents: number;
    averageResponseTime: number;
    overallUptime: number;
  } => {
    const metrics = Object.values(healthMetrics);
    const onlineCount = metrics.filter(m => m.isOnline).length;
    const avgResponseTime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
      : 0;
    const avgUptime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length
      : 0;

    return {
      totalAgents: agents.length,
      onlineAgents: onlineCount,
      offlineAgents: agents.length - onlineCount,
      averageResponseTime: Math.round(avgResponseTime),
      overallUptime: Math.round(avgUptime * 100) / 100,
    };
  };

  const getUnhealthyAgents = (): AgentHealthMetrics[] => {
    return Object.values(healthMetrics).filter(
      m => !m.isOnline || m.consecutiveFailures > 0 || m.responseTime > 5000
    );
  };

  return {
    healthMetrics,
    isMonitoring,
    checkAllAgents,
    checkSingleAgent,
    getAgentHealth,
    getOverallHealth,
    getUnhealthyAgents,
  };
}