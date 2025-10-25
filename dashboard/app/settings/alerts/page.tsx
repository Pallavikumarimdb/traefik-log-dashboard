'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Edit,
  Bell,
  Webhook as WebhookIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TestTube,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Webhook, AlertRule } from '@/lib/types/alerting';
import { Agent } from '@/lib/types/agent';
import WebhookFormModal from '@/components/WebhookFormModal';
import AlertRuleFormModal from '@/components/AlertRuleFormModal';

type TabType = 'webhooks' | 'alerts';

export default function AlertsSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('webhooks');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Modal states
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [webhooksRes, alertsRes, agentsRes] = await Promise.all([
        fetch('/api/webhooks'),
        fetch('/api/alerts'),
        fetch('/api/agents'),
      ]);

      if (webhooksRes.ok) {
        const webhooksData = await webhooksRes.json();
        setWebhooks(webhooksData.webhooks || []);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load alerts and webhooks');
    } finally {
      setLoading(false);
    }
  };

  // Webhook handlers
  const handleAddWebhook = () => {
    setEditingWebhook(null);
    setShowWebhookModal(true);
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setShowWebhookModal(true);
  };

  const handleSaveWebhook = async (webhookData: Partial<Webhook>) => {
    try {
      const url = editingWebhook ? '/api/webhooks' : '/api/webhooks';
      const method = editingWebhook ? 'PATCH' : 'POST';
      const body = editingWebhook
        ? { id: editingWebhook.id, ...webhookData }
        : webhookData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingWebhook ? 'Webhook updated' : 'Webhook created');
        fetchData();
      } else {
        toast.error('Failed to save webhook');
      }
    } catch (error) {
      toast.error('Failed to save webhook');
      throw error;
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhook(webhookId);
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_id: webhookId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test notification sent successfully');
      } else {
        toast.error('Test failed: ' + data.error);
      }
    } catch (error) {
      toast.error('Failed to test webhook');
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleToggleWebhook = async (webhook: Webhook) => {
    try {
      const response = await fetch('/api/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: webhook.id,
          enabled: !webhook.enabled,
        }),
      });

      if (response.ok) {
        toast.success(`Webhook ${!webhook.enabled ? 'enabled' : 'disabled'}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (webhook: Webhook) => {
    if (!confirm(`Delete webhook "${webhook.name}"?`)) return;

    try {
      const response = await fetch(`/api/webhooks?id=${webhook.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Webhook deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete webhook');
    }
  };

  // Alert handlers
  const handleAddAlert = () => {
    setEditingAlert(null);
    setShowAlertModal(true);
  };

  const handleEditAlert = (alert: AlertRule) => {
    setEditingAlert(alert);
    setShowAlertModal(true);
  };

  const handleSaveAlert = async (alertData: Partial<AlertRule>) => {
    try {
      const url = '/api/alerts';
      const method = editingAlert ? 'PATCH' : 'POST';
      const body = editingAlert
        ? { id: editingAlert.id, ...alertData }
        : alertData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingAlert ? 'Alert rule updated' : 'Alert rule created');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save alert rule');
      }
    } catch (error) {
      toast.error('Failed to save alert rule');
      throw error;
    }
  };

  const handleToggleAlert = async (alert: AlertRule) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alert.id,
          enabled: !alert.enabled,
        }),
      });

      if (response.ok) {
        toast.success(`Alert ${!alert.enabled ? 'enabled' : 'disabled'}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };

  const handleDeleteAlert = async (alert: AlertRule) => {
    if (!confirm(`Delete alert rule "${alert.name}"?`)) return;

    try {
      const response = await fetch(`/api/alerts?id=${alert.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Alert rule deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete alert rule');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-8 h-8" />
              Alert Configuration
            </h1>
            <p className="text-gray-600 mt-1">
              Manage webhooks and alert rules for notifications
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <WebhookIcon className="w-4 h-4 inline mr-2" />
            Webhooks ({webhooks.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Alert Rules ({alerts.length})
          </button>
        </nav>
      </div>

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Configure Discord and Telegram webhooks for notifications
            </p>
            <Button onClick={handleAddWebhook}>
              <Plus className="w-4 h-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <WebhookIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
              <p className="text-gray-500 mb-4">Add a webhook to start receiving notifications</p>
              <Button onClick={handleAddWebhook}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Webhook
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{webhook.name}</h3>
                        <Badge variant={webhook.type === 'discord' ? 'default' : 'secondary'}>
                          {webhook.type}
                        </Badge>
                        {webhook.enabled ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      {webhook.description && (
                        <p className="text-sm text-gray-600 mb-2">{webhook.description}</p>
                      )}
                      <p className="text-xs text-gray-500 font-mono truncate max-w-md">
                        {webhook.url}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestWebhook(webhook.id)}
                        disabled={testingWebhook === webhook.id}
                        title="Test webhook"
                      >
                        <TestTube className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleWebhook(webhook)}
                      >
                        {webhook.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditWebhook(webhook)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteWebhook(webhook)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alert Rules Tab */}
      {activeTab === 'alerts' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Configure alert rules to trigger notifications based on metrics
            </p>
            <Button onClick={handleAddAlert}>
              <Plus className="w-4 h-4 mr-2" />
              Add Alert Rule
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alert rules configured</h3>
              <p className="text-gray-500 mb-4">Create an alert rule to start monitoring your traffic</p>
              <Button onClick={handleAddAlert}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Alert Rule
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{alert.name}</h3>
                        <Badge>{alert.trigger_type}</Badge>
                        {alert.interval && <Badge variant="outline">{alert.interval}</Badge>}
                        {alert.enabled ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      {alert.description && (
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      )}
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>{alert.webhook_ids.length} webhook(s)</span>
                        <span>•</span>
                        <span>{alert.parameters.filter(p => p.enabled).length} parameter(s)</span>
                        {alert.agent_id && (
                          <>
                            <span>•</span>
                            <span>Agent: {alert.agent_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAlert(alert)}
                      >
                        {alert.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAlert(alert)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAlert(alert)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <WebhookFormModal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        onSave={handleSaveWebhook}
        webhook={editingWebhook}
      />

      <AlertRuleFormModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        onSave={handleSaveAlert}
        alert={editingAlert}
        webhooks={webhooks}
        agents={agents}
      />
    </div>
  );
}
