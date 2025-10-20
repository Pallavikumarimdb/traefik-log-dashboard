// dashboard/lib/contexts/AgentContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agent } from '../types/agent';

interface AgentContextType {
  agents: Agent[];
  selectedAgent: Agent | null;
  selectAgent: (id: string) => Promise<void>;
  addAgent: (agent: Omit<Agent, 'id' | 'number'>) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
  checkAgentStatus: (id: string) => Promise<boolean>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch agents from API
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, []);

  // Fetch selected agent from API
  const fetchSelectedAgent = useCallback(async () => {
    try {
      const response = await fetch('/api/agents/selected');
      if (response.ok) {
        const data = await response.json();
        setSelectedAgent(data.agent);
      } else {
        // No selected agent, use first available
        if (agents.length > 0) {
          await selectAgent(agents[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch selected agent:', error);
    }
  }, [agents]);

  // Load agents and selected agent on mount
  useEffect(() => {
    const init = async () => {
      await fetchAgents();
      setIsInitialized(true);
    };
    init();
  }, [fetchAgents]);

  // Fetch selected agent after agents are loaded
  useEffect(() => {
    if (isInitialized && agents.length > 0) {
      fetchSelectedAgent();
    }
  }, [isInitialized, agents, fetchSelectedAgent]);

  // Refresh agents
  const refreshAgents = useCallback(async () => {
    await fetchAgents();
    await fetchSelectedAgent();
  }, [fetchAgents, fetchSelectedAgent]);

  // Select agent
  const selectAgent = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/agents/selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: id }),
      });

      if (!response.ok) throw new Error('Failed to select agent');
      
      const data = await response.json();
      setSelectedAgent(data.agent);
    } catch (error) {
      console.error('Failed to select agent:', error);
      throw error;
    }
  }, []);

  // Add agent
  const addAgent = useCallback(async (agent: Omit<Agent, 'id' | 'number'>): Promise<Agent> => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });

      if (!response.ok) throw new Error('Failed to add agent');
      
      const data = await response.json();
      await refreshAgents();
      return data.agent;
    } catch (error) {
      console.error('Failed to add agent:', error);
      throw error;
    }
  }, [refreshAgents]);

  // Update agent
  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) throw new Error('Failed to update agent');
      
      await refreshAgents();
    } catch (error) {
      console.error('Failed to update agent:', error);
      throw error;
    }
  }, [refreshAgents]);

  // Delete agent
  const deleteAgent = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/agents?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete agent');
      }
      
      await refreshAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
      throw error;
    }
  }, [refreshAgents]);

  // Check agent status
  const checkAgentStatus = useCallback(async (id: string): Promise<boolean> => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return false;

    // Update status to checking
    await updateAgent(id, { status: 'checking' });

    try {
      const response = await fetch('/api/agents/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentUrl: agent.url, agentToken: agent.token }),
      });

      const data = await response.json();
      const isOnline = response.ok && data.online;

      await updateAgent(id, {
        status: isOnline ? 'online' : 'offline',
        lastSeen: isOnline ? new Date() : undefined,
      });

      return isOnline;
    } catch (error) {
      await updateAgent(id, { status: 'offline' });
      return false;
    }
  }, [agents, updateAgent]);

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