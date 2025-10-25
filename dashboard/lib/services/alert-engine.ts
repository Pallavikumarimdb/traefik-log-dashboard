// Alert Evaluation Engine
// Evaluates alert rules and triggers notifications based on current metrics

import {
  getEnabledAlertRules,
  getWebhookById,
  addNotificationHistory,
} from '../db/database';
import { sendNotification } from './notification-service';
import { AlertRule, AlertData, AlertInterval } from '../types/alerting';
import { DashboardMetrics } from '../types';

// Track last execution time for each alert rule
const lastExecutionTimes = new Map<string, number>();

// Track alert execution intervals in milliseconds
const intervalMap: Record<AlertInterval, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

/**
 * Alert Evaluation Engine
 * Evaluates alert rules against current metrics and triggers notifications
 */
export class AlertEngine {
  private isRunning = false;

  /**
   * Evaluate all enabled alert rules against current metrics
   */
  async evaluateAlerts(
    agentId: string,
    agentName: string,
    metrics: DashboardMetrics
  ): Promise<void> {
    if (this.isRunning) {
      console.log('Alert evaluation already in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const enabledAlerts = getEnabledAlertRules();
      const now = Date.now();

      for (const alert of enabledAlerts) {
        // Check if alert applies to this agent
        if (alert.agent_id && alert.agent_id !== agentId) {
          continue;
        }

        // Check if alert should trigger based on type
        const shouldTrigger = this.shouldTriggerAlert(alert, now);

        if (shouldTrigger) {
          await this.triggerAlert(alert, agentId, agentName, metrics);
          lastExecutionTimes.set(alert.id, now);
        }
      }
    } catch (error) {
      console.error('Error evaluating alerts:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Determine if an alert should trigger based on its configuration
   */
  private shouldTriggerAlert(alert: AlertRule, now: number): boolean {
    switch (alert.trigger_type) {
      case 'interval':
        return this.shouldTriggerIntervalAlert(alert, now);

      case 'threshold':
        // Threshold alerts always evaluate (threshold check happens in triggerAlert)
        return true;

      case 'event':
        // Event alerts always evaluate (event check happens in triggerAlert)
        return true;

      default:
        return false;
    }
  }

  /**
   * Check if interval-based alert should trigger
   */
  private shouldTriggerIntervalAlert(alert: AlertRule, now: number): boolean {
    if (!alert.interval) return false;

    const intervalMs = intervalMap[alert.interval];
    if (!intervalMs) return false;

    const lastExecution = lastExecutionTimes.get(alert.id);

    // If never executed, trigger immediately
    if (!lastExecution) return true;

    // Check if enough time has passed
    return now - lastExecution >= intervalMs;
  }

  /**
   * Check if threshold-based alert should trigger
   */
  private shouldTriggerThresholdAlert(
    alert: AlertRule,
    metrics: DashboardMetrics
  ): boolean {
    // Check if any threshold parameters are exceeded
    for (const param of alert.parameters) {
      if (!param.enabled || !param.threshold) continue;

      switch (param.parameter) {
        case 'error_rate':
          if (metrics.statusCodes?.errorRate > param.threshold) {
            return true;
          }
          break;

        case 'response_time':
          if (metrics.responseTime?.average > param.threshold) {
            return true;
          }
          break;

        case 'request_count':
          if (metrics.requests?.total > param.threshold) {
            return true;
          }
          break;
      }
    }

    return false;
  }

  /**
   * Trigger an alert by sending notifications to all configured webhooks
   */
  private async triggerAlert(
    alert: AlertRule,
    agentId: string,
    agentName: string,
    metrics: DashboardMetrics
  ): Promise<void> {
    // For threshold alerts, check if threshold is actually exceeded
    if (alert.trigger_type === 'threshold') {
      if (!this.shouldTriggerThresholdAlert(alert, metrics)) {
        return;
      }
    }

    // Build alert data
    const alertData = this.buildAlertData(agentId, agentName, metrics);

    // Send to all webhooks
    for (const webhookId of alert.webhook_ids) {
      try {
        const webhook = getWebhookById(webhookId);
        if (!webhook || !webhook.enabled) {
          console.log(`Webhook ${webhookId} not found or disabled, skipping`);
          continue;
        }

        console.log(`Sending alert "${alert.name}" to webhook "${webhook.name}"`);

        const result = await sendNotification(
          webhook,
          alertData,
          alert.name,
          alert.parameters
        );

        // Log notification history
        addNotificationHistory({
          alert_rule_id: alert.id,
          webhook_id: webhookId,
          agent_id: agentId,
          status: result.success ? 'success' : 'failed',
          error_message: result.error,
          payload: JSON.stringify(alertData),
        });

        if (result.success) {
          console.log(`✓ Alert sent successfully to ${webhook.name}`);
        } else {
          console.error(`✗ Failed to send alert to ${webhook.name}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error sending to webhook ${webhookId}:`, error);

        // Log failed notification
        addNotificationHistory({
          alert_rule_id: alert.id,
          webhook_id: webhookId,
          agent_id: agentId,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          payload: JSON.stringify(alertData),
        });
      }
    }
  }

  /**
   * Build alert data from dashboard metrics
   */
  private buildAlertData(
    agentId: string,
    agentName: string,
    metrics: DashboardMetrics
  ): AlertData {
    return {
      timestamp: new Date().toISOString(),
      agent_name: agentName,
      agent_id: agentId,
      metrics: {
        top_ips: metrics.topClientIPs?.slice(0, 10).map(ip => ({
          ip: ip.ip,
          count: ip.count,
        })),
        top_locations: metrics.geoLocations?.slice(0, 10).map(loc => ({
          country: loc.country,
          city: loc.city,
          count: loc.count,
        })),
        top_routes: metrics.topRoutes?.slice(0, 10).map(route => ({
          path: route.path,
          count: route.count,
          avgDuration: route.avgDuration,
        })),
        top_status_codes: metrics.statusCodes
          ? [
              { status: 200, count: metrics.statusCodes.status2xx },
              { status: 300, count: metrics.statusCodes.status3xx },
              { status: 400, count: metrics.statusCodes.status4xx },
              { status: 500, count: metrics.statusCodes.status5xx },
            ].filter(s => s.count > 0)
          : undefined,
        top_user_agents: metrics.userAgents?.slice(0, 10).map(ua => ({
          browser: ua.browser,
          count: ua.count,
        })),
        top_routers: metrics.routers?.slice(0, 10).map(router => ({
          name: router.name,
          requests: router.requests,
        })),
        top_services: metrics.backends?.slice(0, 10).map(backend => ({
          name: backend.name,
          requests: backend.requests,
        })),
        top_hosts: metrics.topRequestHosts?.slice(0, 10).map(host => ({
          host: host.host,
          count: host.count,
        })),
        top_request_addresses: metrics.topRequestAddresses?.slice(0, 10).map(addr => ({
          addr: addr.addr,
          count: addr.count,
        })),
        top_client_ips: metrics.topClientIPs?.slice(0, 10).map(ip => ({
          ip: ip.ip,
          count: ip.count,
        })),
        error_rate: metrics.statusCodes?.errorRate,
        response_time: metrics.responseTime
          ? {
              average: metrics.responseTime.average,
              p95: metrics.responseTime.p95,
              p99: metrics.responseTime.p99,
            }
          : undefined,
        request_count: metrics.requests?.total,
      },
    };
  }

  /**
   * Reset execution times (useful for testing)
   */
  resetExecutionTimes(): void {
    lastExecutionTimes.clear();
  }

  /**
   * Get last execution time for an alert
   */
  getLastExecutionTime(alertId: string): number | undefined {
    return lastExecutionTimes.get(alertId);
  }
}

// Singleton instance
export const alertEngine = new AlertEngine();
