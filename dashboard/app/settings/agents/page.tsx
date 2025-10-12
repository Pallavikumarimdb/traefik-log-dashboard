// dashboard/app/settings/agents/page.tsx
'use client';

import { useState } from 'react';
import { useAgents } from '@/lib/contexts/AgentContext';
import { Agent } from '@/lib/types/agent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Edit,
  Server,
  MapPin,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Circle,
  Settings as SettingsIcon,
  Activity,
  Upload,
  Download,
} from 'lucide-react';
import AgentFormModal from '@/components/AgentFormModal';
import AgentBulkOperations from '@/components/AgentBulkOperations';
import AgentHealthDashboard from '@/components/AgentHealthDashboard';

type TabType = 'agents' | 'health' | 'bulk';

export default function AgentSettingsPage() {
  const { agents, selectedAgent, selectAgent, deleteAgent, checkAgentStatus, refreshAgents } = useAgents();
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<Record<string, boolean>>({});

  const handleCheckStatus = async (agentId: string) => {
    setCheckingStatus(prev => ({ ...prev, [agentId]: true }));
    await checkAgentStatus(agentId);
    setCheckingStatus(prev => ({ ...prev, [agentId]: false }));
  };

  const handleCheckAllStatus = async () => {
    for (const agent of agents) {
      await handleCheckStatus(agent.id);
    }
  };

  const handleDelete = (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgent(agentId);
    }
  };

  const getStatusIcon = (status?: Agent['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLocationIcon = (location: Agent['location']) => {
    return location === 'on-site' ? (
      <Server className="w-4 h-4 text-blue-600" />
    ) : (
      <MapPin className="w-4 h-4 text-purple-600" />
    );
  };

  const tabs = [
    { id: 'agents' as TabType, label: 'Agents', icon: Server, count: agents.length },
    { id: 'health' as TabType, label: 'Health Monitoring', icon: Activity },
    { id: 'bulk' as TabType, label: 'Bulk Operations', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Agent Settings
          </h1>
          <p className="text-muted-foreground">
            Configure and monitor your Traefik log dashboard agents
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-white/10">
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-black dark:border-white text-black dark:text-white font-medium'
                      : 'border-transparent text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <Badge variant="secondary" className="ml-1">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Server className="w-10 h-10 text-black dark:text-white" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {agents.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Agents</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {agents.filter(a => a.status === 'online').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Online</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="w-10 h-10 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {agents.filter(a => a.status === 'offline').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Offline</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Agents
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleCheckAllStatus}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check All
                </Button>
                <Button
                  onClick={() => {
                    setEditingAgent(null);
                    setShowAddModal(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Agent
                </Button>
              </div>
            </div>

            {/* Agent List */}
            <div className="space-y-4">
              {agents.length === 0 ? (
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-12 text-center">
                  <Server className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Agents Configured
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by adding your first agent to monitor Traefik logs
                  </p>
                  <Button
                    onClick={() => {
                      setEditingAgent(null);
                      setShowAddModal(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Agent
                  </Button>
                </div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`bg-white dark:bg-black border-2 rounded-lg p-6 transition-all ${
                      selectedAgent?.id === agent.id
                        ? 'border-black dark:border-white'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          {getStatusIcon(checkingStatus[agent.id] ? 'checking' : agent.status)}
                          
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Agent #{agent.number}
                            </h3>
                            <span className="text-gray-400">·</span>
                            <span className="text-lg text-gray-900 dark:text-white">
                              {agent.name}
                            </span>
                          </div>

                          {selectedAgent?.id === agent.id && (
                            <Badge variant="default" className="bg-black dark:bg-white text-white dark:text-black">
                              Active
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {getLocationIcon(agent.location)}
                            <span className="capitalize">{agent.location}</span>
                            {agent.tags && agent.tags.length > 0 && (
                              <>
                                <span>·</span>
                                <div className="flex gap-1 flex-wrap">
                                  {agent.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          <div className="text-muted-foreground">
                            <span className="font-mono text-xs">{agent.url}</span>
                          </div>

                          {agent.description && (
                            <div className="text-muted-foreground">{agent.description}</div>
                          )}

                          {agent.lastSeen && (
                            <div className="text-xs text-muted-foreground">
                              Last seen: {agent.lastSeen.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {selectedAgent?.id !== agent.id && (
                          <Button
                            onClick={() => selectAgent(agent.id)}
                            variant="outline"
                            size="sm"
                          >
                            Select
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleCheckStatus(agent.id)}
                          variant="outline"
                          size="sm"
                          disabled={checkingStatus[agent.id]}
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${checkingStatus[agent.id] ? 'animate-spin' : ''}`}
                          />
                        </Button>

                        <Button
                          onClick={() => {
                            setEditingAgent(agent);
                            setShowAddModal(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          onClick={() => handleDelete(agent.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Setup Guide */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Quick Setup Guide
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
                <li>Deploy agents on servers where Traefik logs are located</li>
                <li>Configure unique authentication tokens for secure communication</li>
                <li>On-site agents: Running on the same network as the dashboard</li>
                <li>Off-site agents: Running on remote servers or cloud instances</li>
                <li>Agent numbering is automatically assigned sequentially</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div>
            <AgentHealthDashboard />
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
            <AgentBulkOperations />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AgentFormModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingAgent(null);
          }}
          agent={editingAgent}
        />
      )}
    </div>
  );
}