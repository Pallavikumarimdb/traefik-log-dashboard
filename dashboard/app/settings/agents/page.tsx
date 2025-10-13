// dashboard/app/settings/agents/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  ChevronLeft,
} from 'lucide-react';
import AgentFormModal from '@/components/AgentFormModal';
import AgentBulkOperations from '@/components/AgentBulkOperations';
import AgentHealthDashboard from '@/components/AgentHealthDashboard';

type TabType = 'agents' | 'health' | 'bulk';

export default function AgentSettingsPage() {
  const { agents, selectedAgent, deleteAgent, checkAgentStatus } = useAgents();
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
      <Server className="w-4 h-4 text-red-600" />
    ) : (
      <MapPin className="w-4 h-4 text-red-700" />
    );
  };

  const tabs = [
    { id: 'agents' as TabType, label: 'Agents', icon: Server, count: agents.length },
    { id: 'health' as TabType, label: 'Health Monitoring', icon: Activity },
    { id: 'bulk' as TabType, label: 'Bulk Operations', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <Link href="/dashboard">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-900 truncate">
              Agent Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Configure and monitor your Traefik log dashboard agents
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-red-200">
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-600 text-red-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-red-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <Badge variant="secondary" className="ml-1 bg-red-50 text-red-700 border-red-200">
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
              <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Server className="w-10 h-10 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {agents.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Agents</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {agents.filter(a => a.status === 'online').length}
                    </div>
                    <div className="text-sm text-gray-600">Online</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <XCircle className="w-10 h-10 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {agents.filter(a => a.status === 'offline').length}
                    </div>
                    <div className="text-sm text-gray-600">Offline</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Agents
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleCheckAllStatus}
                  variant="outline"
                  className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check All
                </Button>
                <Button
                  onClick={() => {
                    setEditingAgent(null);
                    setShowAddModal(true);
                  }}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add Agent
                </Button>
              </div>
            </div>

            {/* Agent List */}
            <div className="space-y-4">
              {agents.length === 0 ? (
                <div className="bg-white border border-red-200 rounded-lg p-12 text-center shadow-sm">
                  <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Agents Configured
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by adding your first agent to monitor Traefik logs
                  </p>
                  <Button
                    onClick={() => {
                      setEditingAgent(null);
                      setShowAddModal(true);
                    }}
                    className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Agent
                  </Button>
                </div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`bg-white border-2 rounded-lg p-6 transition-all shadow-sm ${
                      selectedAgent?.id === agent.id
                        ? 'border-red-600'
                        : 'border-red-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          {getStatusIcon(checkingStatus[agent.id] ? 'checking' : agent.status)}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {agent.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={
                              agent.status === 'online'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : agent.status === 'offline'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }
                          >
                            {agent.status === 'online' ? 'Active' : agent.status === 'checking' ? 'Checking' : 'Default Agent'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            {getLocationIcon(agent.location)}
                            <span className="text-gray-600 capitalize">
                              {agent.location.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Agent #</span> {agent.number}
                          </div>
                          <div className="col-span-2 flex items-center gap-2 text-gray-600 font-mono text-xs">
                            <Server className="w-3 h-3" />
                            {agent.url}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleCheckStatus(agent.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
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
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          onClick={() => handleDelete(agent.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50"
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-red-900 mb-3">
                Quick Setup Guide
              </h4>
              <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
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
          <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
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