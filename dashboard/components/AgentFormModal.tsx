'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/lib/types/agent';
import { useAgents } from '@/lib/contexts/AgentContext';
import { AgentConfigManager } from '@/lib/agent-config-manager';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
}

export default function AgentFormModal({ isOpen, onClose, agent }: AgentFormModalProps) {
  const { addAgent, updateAgent } = useAgents();
  const [errors, setErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    token: '',
    location: 'on-site' as Agent['location'],
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        url: agent.url,
        token: agent.token,
        location: agent.location,
        description: agent.description || '',
        tags: agent.tags?.join(', ') || '',
      });
    } else {
      setFormData({
        name: '',
        url: 'http://traefik-agent:5000',
        token: '',
        location: 'on-site',
        description: '',
        tags: '',
      });
    }
    setErrors([]);
  }, [agent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const agentData = {
      name: formData.name.trim(),
      url: formData.url.trim(),
      token: formData.token.trim(),
      location: formData.location,
      description: formData.description.trim() || undefined,
      tags: formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
    };

    const validation = AgentConfigManager.validateAgent(agentData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      if (agent) {
        updateAgent(agent.id, agentData);
      } else {
        addAgent(agentData);
      }
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to save agent']);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border border-gray-200 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {agent ? 'Edit Agent' : 'Add New Agent'}
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-1">
                    Please fix the following errors:
                  </h4>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Production Server"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-600">
              A friendly name to identify this agent
            </p>
          </div>

          {/* Agent URL */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Agent URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="http://traefik-agent:5000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-600">
              The base URL where the agent is running (include http:// or https://)
            </p>
          </div>

          {/* Authentication Token */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Authentication Token *
            </label>
            <input
              type="password"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              placeholder="your-secret-token"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-600">
              The TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN configured on the agent
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Location *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="on-site"
                  checked={formData.location === 'on-site'}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value as Agent['location'] })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-900">On-site</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="off-site"
                  checked={formData.location === 'off-site'}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value as Agent['location'] })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-900">Off-site</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              On-site: Same network · Off-site: Remote server or cloud
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Monitoring production Traefik logs on AWS EC2"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="production, us-east-1, aws"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-600">
              Comma-separated tags to help organize agents
            </p>
          </div>

          {/* Agent Number Preview */}
          {!agent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                This agent will be automatically assigned the next sequential number
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {agent ? 'Update Agent' : 'Add Agent'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}