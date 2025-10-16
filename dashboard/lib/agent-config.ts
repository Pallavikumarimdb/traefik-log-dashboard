/**
 * Agent configuration loaded at runtime
 * This ensures environment variables are read when the API routes execute,
 * not baked in at build time
 */

export function getAgentConfig() {
  return {
    url: process.env.AGENT_API_URL || 'http://traefik-agent:5000',
    token: process.env.AGENT_API_TOKEN || '',
  };
}

export const agentConfig = getAgentConfig();