// Notification Service for sending alerts to Discord and Telegram

import {
  Webhook,
  AlertData,
  DiscordWebhookPayload,
  DiscordEmbed,
  DiscordEmbedField,
  TelegramWebhookPayload,
  AlertParameterConfig,
} from '../types/alerting';

/**
 * Send notification to a webhook
 */
export async function sendNotification(
  webhook: Webhook,
  alertData: AlertData,
  alertName: string,
  parameters: AlertParameterConfig[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (webhook.type === 'discord') {
      return await sendDiscordNotification(webhook, alertData, alertName, parameters);
    } else if (webhook.type === 'telegram') {
      return await sendTelegramNotification(webhook, alertData, alertName, parameters);
    }
    return { success: false, error: 'Unknown webhook type' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send Discord notification with embeds
 */
async function sendDiscordNotification(
  webhook: Webhook,
  alertData: AlertData,
  alertName: string,
  parameters: AlertParameterConfig[]
): Promise<{ success: boolean; error?: string }> {
  const embed: DiscordEmbed = {
    title: `🚨 ${alertName}`,
    description: `Alert triggered at ${new Date(alertData.timestamp).toLocaleString()}`,
    color: 0x5865f2, // Discord Blurple
    fields: [],
    timestamp: alertData.timestamp,
    footer: {
      text: 'Traefik Log Dashboard',
    },
  };

  if (alertData.agent_name) {
    embed.author = {
      name: `Agent: ${alertData.agent_name}`,
    };
  }

  // Add fields based on enabled parameters
  for (const param of parameters) {
    if (!param.enabled) continue;

    const field = createDiscordField(param, alertData);
    if (field) {
      embed.fields!.push(field);
    }
  }

  const payload: DiscordWebhookPayload = {
    username: 'Traefik Alert',
    embeds: [embed],
  };

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Discord API error: ${response.status} - ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Create Discord embed field based on parameter
 */
function createDiscordField(
  param: AlertParameterConfig,
  alertData: AlertData
): DiscordEmbedField | null {
  const { parameter, limit = 5 } = param;
  const metrics = alertData.metrics;

  switch (parameter) {
    case 'top_ips':
      if (metrics.top_ips && metrics.top_ips.length > 0) {
        const ips = metrics.top_ips.slice(0, limit);
        return {
          name: `🔝 Top ${limit} IPs`,
          value: ips.map((ip, i) => `${i + 1}. \`${ip.ip}\` - ${ip.count} requests`).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_locations':
      if (metrics.top_locations && metrics.top_locations.length > 0) {
        const locations = metrics.top_locations.slice(0, limit);
        return {
          name: `🌍 Top ${limit} Locations`,
          value: locations.map((loc, i) => {
            const location = loc.city ? `${loc.city}, ${loc.country}` : loc.country;
            return `${i + 1}. ${location} - ${loc.count} requests`;
          }).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_routes':
      if (metrics.top_routes && metrics.top_routes.length > 0) {
        const routes = metrics.top_routes.slice(0, limit);
        return {
          name: `🛣️ Top ${limit} Routes`,
          value: routes.map((route, i) =>
            `${i + 1}. \`${route.path}\` - ${route.count} requests (${route.avgDuration.toFixed(0)}ms avg)`
          ).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_status_codes':
      if (metrics.top_status_codes && metrics.top_status_codes.length > 0) {
        const statuses = metrics.top_status_codes.slice(0, limit);
        return {
          name: `📊 Top ${limit} Status Codes`,
          value: statuses.map((status, i) => {
            const emoji = getStatusEmoji(status.status);
            return `${i + 1}. ${emoji} \`${status.status}\` - ${status.count} responses`;
          }).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_user_agents':
      if (metrics.top_user_agents && metrics.top_user_agents.length > 0) {
        const agents = metrics.top_user_agents.slice(0, limit);
        return {
          name: `🌐 Top ${limit} User Agents`,
          value: agents.map((agent, i) =>
            `${i + 1}. ${agent.browser} - ${agent.count} requests`
          ).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_routers':
      if (metrics.top_routers && metrics.top_routers.length > 0) {
        const routers = metrics.top_routers.slice(0, limit);
        return {
          name: `🔀 Top ${limit} Routers`,
          value: routers.map((router, i) =>
            `${i + 1}. \`${router.name}\` - ${router.requests} requests`
          ).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_services':
      if (metrics.top_services && metrics.top_services.length > 0) {
        const services = metrics.top_services.slice(0, limit);
        return {
          name: `⚙️ Top ${limit} Services`,
          value: services.map((service, i) =>
            `${i + 1}. \`${service.name}\` - ${service.requests} requests`
          ).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_hosts':
      if (metrics.top_hosts && metrics.top_hosts.length > 0) {
        const hosts = metrics.top_hosts.slice(0, limit);
        return {
          name: `🏠 Top ${limit} Hosts`,
          value: hosts.map((host, i) =>
            `${i + 1}. \`${host.host}\` - ${host.count} requests`
          ).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_request_addresses':
      if (metrics.top_request_addresses && metrics.top_request_addresses.length > 0) {
        const addresses = metrics.top_request_addresses.slice(0, limit);
        return {
          name: `📍 Top ${limit} Request Addresses`,
          value: addresses.map((addr, i) =>
            `${i + 1}. \`${addr.addr}\` - ${addr.count} requests`
          ).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'top_client_ips':
      if (metrics.top_client_ips && metrics.top_client_ips.length > 0) {
        const clients = metrics.top_client_ips.slice(0, limit);
        return {
          name: `👥 Top ${limit} Client IPs`,
          value: clients.map((client, i) =>
            `${i + 1}. \`${client.ip}\` - ${client.count} requests`
          ).join('\n') || 'No data',
          inline: false,
        };
      }
      break;

    case 'error_rate':
      if (metrics.error_rate !== undefined) {
        return {
          name: '❌ Error Rate',
          value: `${metrics.error_rate.toFixed(2)}%`,
          inline: true,
        };
      }
      break;

    case 'response_time':
      if (metrics.response_time) {
        return {
          name: '⏱️ Response Time',
          value: [
            `Avg: ${metrics.response_time.average.toFixed(0)}ms`,
            `P95: ${metrics.response_time.p95.toFixed(0)}ms`,
            `P99: ${metrics.response_time.p99.toFixed(0)}ms`,
          ].join('\n'),
          inline: true,
        };
      }
      break;

    case 'request_count':
      if (metrics.request_count !== undefined) {
        return {
          name: '📈 Total Requests',
          value: metrics.request_count.toString(),
          inline: true,
        };
      }
      break;
  }

  return null;
}

/**
 * Get emoji for HTTP status code
 */
function getStatusEmoji(status: number): string {
  if (status >= 200 && status < 300) return '✅';
  if (status >= 300 && status < 400) return '🔄';
  if (status >= 400 && status < 500) return '⚠️';
  if (status >= 500) return '❌';
  return '❓';
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(
  webhook: Webhook,
  alertData: AlertData,
  alertName: string,
  parameters: AlertParameterConfig[]
): Promise<{ success: boolean; error?: string }> {
  let message = `🚨 *${alertName}*\n\n`;
  message += `_Alert triggered at ${new Date(alertData.timestamp).toLocaleString()}_\n\n`;

  if (alertData.agent_name) {
    message += `*Agent:* ${alertData.agent_name}\n\n`;
  }

  // Add sections based on enabled parameters
  for (const param of parameters) {
    if (!param.enabled) continue;

    const section = createTelegramSection(param, alertData);
    if (section) {
      message += section + '\n\n';
    }
  }

  message += '_Traefik Log Dashboard_';

  const payload: TelegramWebhookPayload = {
    text: message,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  };

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Telegram API error: ${response.status} - ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Create Telegram message section based on parameter
 */
function createTelegramSection(
  param: AlertParameterConfig,
  alertData: AlertData
): string | null {
  const { parameter, limit = 5 } = param;
  const metrics = alertData.metrics;

  switch (parameter) {
    case 'top_ips':
      if (metrics.top_ips && metrics.top_ips.length > 0) {
        const ips = metrics.top_ips.slice(0, limit);
        return `*🔝 Top ${limit} IPs*\n` + ips.map((ip, i) =>
          `${i + 1}. \`${ip.ip}\` - ${ip.count} requests`
        ).join('\n');
      }
      break;

    case 'top_locations':
      if (metrics.top_locations && metrics.top_locations.length > 0) {
        const locations = metrics.top_locations.slice(0, limit);
        return `*🌍 Top ${limit} Locations*\n` + locations.map((loc, i) => {
          const location = loc.city ? `${loc.city}, ${loc.country}` : loc.country;
          return `${i + 1}. ${location} - ${loc.count} requests`;
        }).join('\n');
      }
      break;

    case 'top_routes':
      if (metrics.top_routes && metrics.top_routes.length > 0) {
        const routes = metrics.top_routes.slice(0, limit);
        return `*🛣️ Top ${limit} Routes*\n` + routes.map((route, i) =>
          `${i + 1}. \`${route.path}\` - ${route.count} requests (${route.avgDuration.toFixed(0)}ms avg)`
        ).join('\n');
      }
      break;

    case 'top_status_codes':
      if (metrics.top_status_codes && metrics.top_status_codes.length > 0) {
        const statuses = metrics.top_status_codes.slice(0, limit);
        return `*📊 Top ${limit} Status Codes*\n` + statuses.map((status, i) =>
          `${i + 1}. \`${status.status}\` - ${status.count} responses`
        ).join('\n');
      }
      break;

    case 'top_user_agents':
      if (metrics.top_user_agents && metrics.top_user_agents.length > 0) {
        const agents = metrics.top_user_agents.slice(0, limit);
        return `*🌐 Top ${limit} User Agents*\n` + agents.map((agent, i) =>
          `${i + 1}. ${agent.browser} - ${agent.count} requests`
        ).join('\n');
      }
      break;

    case 'top_routers':
      if (metrics.top_routers && metrics.top_routers.length > 0) {
        const routers = metrics.top_routers.slice(0, limit);
        return `*🔀 Top ${limit} Routers*\n` + routers.map((router, i) =>
          `${i + 1}. \`${router.name}\` - ${router.requests} requests`
        ).join('\n');
      }
      break;

    case 'top_services':
      if (metrics.top_services && metrics.top_services.length > 0) {
        const services = metrics.top_services.slice(0, limit);
        return `*⚙️ Top ${limit} Services*\n` + services.map((service, i) =>
          `${i + 1}. \`${service.name}\` - ${service.requests} requests`
        ).join('\n');
      }
      break;

    case 'top_hosts':
      if (metrics.top_hosts && metrics.top_hosts.length > 0) {
        const hosts = metrics.top_hosts.slice(0, limit);
        return `*🏠 Top ${limit} Hosts*\n` + hosts.map((host, i) =>
          `${i + 1}. \`${host.host}\` - ${host.count} requests`
        ).join('\n');
      }
      break;

    case 'top_request_addresses':
      if (metrics.top_request_addresses && metrics.top_request_addresses.length > 0) {
        const addresses = metrics.top_request_addresses.slice(0, limit);
        return `*📍 Top ${limit} Request Addresses*\n` + addresses.map((addr, i) =>
          `${i + 1}. \`${addr.addr}\` - ${addr.count} requests`
        ).join('\n');
      }
      break;

    case 'top_client_ips':
      if (metrics.top_client_ips && metrics.top_client_ips.length > 0) {
        const clients = metrics.top_client_ips.slice(0, limit);
        return `*👥 Top ${limit} Client IPs*\n` + clients.map((client, i) =>
          `${i + 1}. \`${client.ip}\` - ${client.count} requests`
        ).join('\n');
      }
      break;

    case 'error_rate':
      if (metrics.error_rate !== undefined) {
        return `*❌ Error Rate*\n${metrics.error_rate.toFixed(2)}%`;
      }
      break;

    case 'response_time':
      if (metrics.response_time) {
        return `*⏱️ Response Time*\nAvg: ${metrics.response_time.average.toFixed(0)}ms | P95: ${metrics.response_time.p95.toFixed(0)}ms | P99: ${metrics.response_time.p99.toFixed(0)}ms`;
      }
      break;

    case 'request_count':
      if (metrics.request_count !== undefined) {
        return `*📈 Total Requests*\n${metrics.request_count}`;
      }
      break;
  }

  return null;
}
