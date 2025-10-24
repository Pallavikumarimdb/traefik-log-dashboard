// dashboard/lib/contexts/AgentContext.tsx
// FIXES:
// 1. Parallel fetching in refreshAgents for better performance
// 2. Removed agents dependency from fetchSelectedAgent to prevent unnecessary refetches
// 3. Enhanced error handling with more specific messages

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Agent } from '../types/agent';
import { toast } from 'sonner';

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

  // Fetch all agents
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      
      const data = await response.json();
      setAgents(data.agents);
      return data.agents; // Return agents for use in parallel fetching
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast.error('Failed to load agents', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      return []; // Return empty array on error
    }
  }, []);

  // Fetch selected agent - FIXED: Removed agents dependency
  const fetchSelectedAgent = useCallback(async () => {
    try {
      const response = await fetch('/api/agents/selected');
      if (response.ok) {
        const data = await response.json();
        setSelectedAgent(data.agent);
      }
    } catch (error) {
      console.error('Failed to fetch selected agent:', error);
    }
  }, []); // Removed agents dependency to prevent unnecessary refetches

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
  }, [isInitialized, agents.length, fetchSelectedAgent]); // Use agents.length instead of agents

  // FIXED: Optimized refresh to run fetches in parallel
  const refreshAgents = useCallback(async () => {
    try {
      // Run both fetches in parallel for better performance
      await Promise.all([
        fetchAgents(),
        fetchSelectedAgent()
      ]);
    } catch (error) {
      console.error('Failed to refresh agents:', error);
    }
  }, [fetchAgents, fetchSelectedAgent]);

  // Select agent
  const selectAgent = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/agents/selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to select agent');
      }
      
      const data = await response.json();
      setSelectedAgent(data.agent);
      toast.success('Agent selected successfully', {
        description: `Switched to ${data.agent.name}`
      });
    } catch (error) {
      console.error('Failed to select agent:', error);
      toast.error('Failed to select agent', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add agent');
      }
      
      const data = await response.json();
      
      // Optimized: Add to state directly instead of full refresh
      setAgents(prev => [...prev, data.agent]);
      
      toast.success('Agent added successfully');
      return data.agent;
    } catch (error) {
      console.error('Failed to add agent:', error);
      toast.error('Failed to add agent', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  }, []);

  // Update agent
  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update agent');
      }
      
      const data = await response.json();
      
      // Optimized: Update state directly instead of full refresh
      setAgents(prev => prev.map(a => a.id === id ? data.agent : a));
      
      if (selectedAgent?.id === id) {
        setSelectedAgent(data.agent);
      }
      
      // Only show toast for manual updates, not status checks
      if (!updates.status) {
        toast.success('Agent updated successfully');
      }
    } catch (error) {
      console.error('Failed to update agent:', error);
      toast.error('Failed to update agent', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  }, [selectedAgent]);

  // FIXED: Enhanced delete agent with better error messages
  const deleteAgent = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/agents?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete agent');
      }
      
      // Optimized: Update state directly instead of full refresh
      setAgents(prev => prev.filter(a => a.id !== id));
      
      if (selectedAgent?.id === id) {
        // Select first available agent if current was deleted
        const remaining = agents.filter(a => a.id !== id);
        if (remaining.length > 0) {
          await selectAgent(remaining[0].id);
        } else {
          setSelectedAgent(null);
        }
      }
      
      toast.success('Agent deleted successfully');
    } catch (error) {
      console.error('Failed to delete agent:', error);
      
      // FIXED: Enhanced error message handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete agent';
      
      // Check for specific error types and show user-friendly messages
      if (errorMessage.includes('environment-sourced') || errorMessage.includes('Cannot delete environment')) {
        toast.error('Cannot Delete Environment Agent', {
          description: 'This agent is configured in environment variables (docker-compose.yml or .env) and cannot be deleted from the UI. To remove it, update your environment configuration and restart the service.',
          duration: 7000, // Longer duration for more complex message
        });
      } else if (errorMessage.includes('not found')) {
        toast.error('Agent Not Found', {
          description: 'The agent you are trying to delete no longer exists.',
          duration: 5000,
        });
      } else {
        toast.error('Failed to Delete Agent', {
          description: errorMessage,
          duration: 5000,
        });
      }
      
      throw error;
    }
  }, [agents, selectedAgent, selectAgent]);

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
