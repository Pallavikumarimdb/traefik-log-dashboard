'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Agent } from '../types/agent';
import { useAgents } from '../contexts/AgentContext';

interface AgentHealthMetrics {
  agentId: string;
  isOnline: boolean;
  responseTime: number;
  lastChecked: Date;
  consecutiveFailures: number;
  uptime: number;
  error?: string;
}

interface HealthMonitorOptions {
  checkInterval?: number;
  enableAutoCheck?: boolean;
  onStatusChange?: (agentId: string, isOnline: boolean) => void;
}

export function useAgentHealth(options: HealthMonitorOptions = {}) {
  const {
    checkInterval = 30000,
    enableAutoCheck = true,
    onStatusChange,
  } = options;

  const { agents, checkAgentStatus } = useAgents();
  const [healthMetrics, setHealthMetrics] = useState<Record<string, AgentHealthMetrics>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Use refs to avoid dependency issues
  const healthMetricsRef = useRef(healthMetrics);
  const onStatusChangeRef = useRef(onStatusChange);

  // Update refs when values change
  useEffect(() => {
    healthMetricsRef.current = healthMetrics;
  }, [healthMetrics]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const calculateUptime = useCallback((agentId: string, currentStatus: boolean): number => {
    const current = healthMetricsRef.current[agentId];
    if (!current) return currentStatus ? 100 : 0;

    const totalChecks = current.consecutiveFailures + 1;
    const successfulChecks = currentStatus 
      ? totalChecks - current.consecutiveFailures 
      : totalChecks - current.consecutiveFailures - 1;
    
    return (successfulChecks / totalChecks) * 100;
  }, []);

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
    const currentMetrics = healthMetricsRef.current[agent.id];

    return {
      agentId: agent.id,
      isOnline,
      responseTime,
      lastChecked: new Date(),
      consecutiveFailures: isOnline ? 0 : (currentMetrics?.consecutiveFailures || 0) + 1,
      uptime: calculateUptime(agent.id, isOnline),
      error,
    };
  }, [checkAgentStatus, calculateUptime]);

  const checkAllAgents = useCallback(async () => {
    if (agents.length === 0) {
      setIsMonitoring(false);
      return;
    }

    setIsMonitoring(true);

    const results = await Promise.all(
      agents.map(agent => checkSingleAgent(agent))
    );

    const newMetrics: Record<string, AgentHealthMetrics> = {};
    results.forEach(metric => {
      newMetrics[metric.agentId] = metric;

      // Trigger status change callback if status changed
      const previousStatus = healthMetricsRef.current[metric.agentId]?.isOnline;
      if (previousStatus !== undefined && previousStatus !== metric.isOnline && onStatusChangeRef.current) {
        onStatusChangeRef.current(metric.agentId, metric.isOnline);
      }
    });

    setHealthMetrics(newMetrics);
    setIsMonitoring(false);
  }, [agents, checkSingleAgent]); // Removed healthMetrics from dependencies

  // Auto-check setup - only depends on static values and agents
  useEffect(() => {
    if (!enableAutoCheck || agents.length === 0) return;

    // Initial check
    checkAllAgents();

    // Set up interval
    const interval = setInterval(checkAllAgents, checkInterval);

    return () => clearInterval(interval);
  }, [enableAutoCheck, checkInterval, agents.length]); // Removed checkAllAgents dependency

  const getAgentHealth = useCallback((agentId: string): AgentHealthMetrics | null => {
    return healthMetrics[agentId] || null;
  }, [healthMetrics]);

  const getOverallHealth = useCallback((): {
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
  }, [healthMetrics, agents.length]);

  const getUnhealthyAgents = useCallback((): AgentHealthMetrics[] => {
    return Object.values(healthMetrics).filter(
      m => !m.isOnline || m.consecutiveFailures > 0 || m.responseTime > 5000
    );
  }, [healthMetrics]);

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