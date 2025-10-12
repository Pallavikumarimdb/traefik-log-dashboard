// dashboard/lib/contexts/AgentContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agent } from '../types/agent';
import { AgentConfigManager } from '../agent-config-manager';

interface AgentContextType {
  agents: Agent[];
  selectedAgent: Agent | null;
  selectAgent: (id: string) => void;
  addAgent: (agent: Omit<Agent, 'id' | 'number'>) => Agent;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  refreshAgents: () => void;
  checkAgentStatus: (id: string) => Promise<boolean>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Load agents on mount
  useEffect(() => {
    refreshAgents();
  }, []);

  // Update selected agent when agents or selection changes
  useEffect(() => {
    if (selectedAgentId) {
      AgentConfigManager.setSelectedAgentId(selectedAgentId);
    }
  }, [selectedAgentId]);

  const refreshAgents = useCallback(() => {
    const loadedAgents = AgentConfigManager.getAgents();
    setAgents(loadedAgents);
    
    const selectedId = AgentConfigManager.getSelectedAgentId();
    if (selectedId && loadedAgents.find(a => a.id === selectedId)) {
      setSelectedAgentId(selectedId);
    } else if (loadedAgents.length > 0) {
      setSelectedAgentId(loadedAgents[0].id);
    }
  }, []);

  const selectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
    AgentConfigManager.setSelectedAgentId(id);
  }, []);

  const addAgent = useCallback((agent: Omit<Agent, 'id' | 'number'>) => {
    const newAgent = AgentConfigManager.addAgent(agent);
    refreshAgents();
    return newAgent;
  }, [refreshAgents]);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    AgentConfigManager.updateAgent(id, updates);
    refreshAgents();
  }, [refreshAgents]);

  const deleteAgent = useCallback((id: string) => {
    AgentConfigManager.deleteAgent(id);
    refreshAgents();
  }, [refreshAgents]);

  const checkAgentStatus = useCallback(async (id: string): Promise<boolean> => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return false;

    try {
      const response = await fetch('/api/agents/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentUrl: agent.url, agentToken: agent.token }),
      });

      const data = await response.json();
      const isOnline = response.ok && data.online;

      AgentConfigManager.updateAgentStatus(id, isOnline);
      refreshAgents();

      return isOnline;
    } catch (error) {
      AgentConfigManager.updateAgentStatus(id, false, String(error));
      refreshAgents();
      return false;
    }
  }, [agents, refreshAgents]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0] || null;

  return (
    <AgentContext.Provider
      value={{
        agents,
        selectedAgent,
        selectAgent,
        addAgent,
        updateAgent,
        deleteAgent,
        refreshAgents,
        checkAgentStatus,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
}