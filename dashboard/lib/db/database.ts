// dashboard/lib/db/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Agent, AgentUpdate } from '../types/agent';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'agents.db');

let db: Database.Database | null = null;

/**
 * Initialize SQLite database with agents table
 */
export function initDatabase(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Create agents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      token TEXT NOT NULL,
      location TEXT NOT NULL CHECK(location IN ('on-site', 'off-site')),
      number INTEGER NOT NULL,
      status TEXT CHECK(status IN ('online', 'offline', 'checking')),
      last_seen TEXT,
      description TEXT,
      tags TEXT,
      source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('env', 'manual')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_agents_source ON agents(source);
    CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

    CREATE TABLE IF NOT EXISTS selected_agent (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      agent_id TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

/**
 * Get database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Sync environment variable agents to database
 */
export function syncEnvAgents(): void {
  const db = getDatabase();
  
  const envUrl = process.env.AGENT_API_URL;
  const envToken = process.env.AGENT_API_TOKEN;
  
  if (!envUrl || !envToken) {
    console.log('No environment agents to sync');
    return;
  }

  const existing = db.prepare(`
    SELECT id FROM agents WHERE source = 'env' LIMIT 1
  `).get();

  const envAgent: Partial<Agent> = {
    id: 'agent-env-001',
    name: process.env.AGENT_NAME || 'Environment Agent',
    url: envUrl,
    token: envToken,
    location: 'on-site',
    number: 1,
    status: 'checking',
  };

  if (existing) {
    db.prepare(`
      UPDATE agents 
      SET name = ?, url = ?, token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE source = 'env'
    `).run(envAgent.name, envAgent.url, envAgent.token);
    
    console.log('Updated environment agent in database');
  } else {
    db.prepare(`
      INSERT INTO agents (id, name, url, token, location, number, status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'env')
    `).run(
      envAgent.id,
      envAgent.name,
      envAgent.url,
      envAgent.token,
      envAgent.location,
      envAgent.number,
      envAgent.status
    );
    
    console.log('Added environment agent to database');
  }
}

/**
 * Get all agents from database
 */
export function getAllAgents(): Agent[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM agents ORDER BY number ASC
  `).all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    url: row.url,
    token: row.token,
    location: row.location,
    number: row.number,
    status: row.status,
    lastSeen: row.last_seen ? new Date(row.last_seen) : undefined,
    description: row.description,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
  }));
}

/**
 * Get agent by ID
 */
export function getAgentById(id: string): Agent | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM agents WHERE id = ?
  `).get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    url: row.url,
    token: row.token,
    location: row.location,
    number: row.number,
    status: row.status,
    lastSeen: row.last_seen ? new Date(row.last_seen) : undefined,
    description: row.description,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
  };
}

/**
 * Add new agent to database
 */
export function addAgent(agent: Omit<Agent, 'id' | 'number'>): Agent {
  const db = getDatabase();
  
  const result = db.prepare(`
    SELECT COALESCE(MAX(number), 0) + 1 as next_number FROM agents
  `).get() as { next_number: number };
  
  const nextNumber = result.next_number;
  const newAgent: Agent = {
    ...agent,
    id: `agent-${String(nextNumber).padStart(3, '0')}`,
    number: nextNumber,
    status: 'checking',
  };

  db.prepare(`
    INSERT INTO agents (id, name, url, token, location, number, status, description, tags, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
  `).run(
    newAgent.id,
    newAgent.name,
    newAgent.url,
    newAgent.token,
    newAgent.location,
    newAgent.number,
    newAgent.status,
    newAgent.description || null,
    newAgent.tags ? JSON.stringify(newAgent.tags) : null
  );

  return newAgent;
}

/**
 * Update agent in database
 * FIX: Handle lastSeen as both Date objects and ISO strings
 */
export function updateAgent(id: string, updates: AgentUpdate): void {
  const db = getDatabase();
  
  const sets: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.url !== undefined) {
    sets.push('url = ?');
    values.push(updates.url);
  }
  if (updates.token !== undefined) {
    sets.push('token = ?');
    values.push(updates.token);
  }
  if (updates.location !== undefined) {
    sets.push('location = ?');
    values.push(updates.location);
  }
  if (updates.status !== undefined) {
    sets.push('status = ?');
    values.push(updates.status);
  }
  if (updates.lastSeen !== undefined) {
    sets.push('last_seen = ?');
    // FIX: Handle both Date objects and ISO strings
    if (updates.lastSeen instanceof Date) {
      values.push(updates.lastSeen.toISOString());
    } else if (typeof updates.lastSeen === 'string') {
      values.push(updates.lastSeen);
    } else if (updates.lastSeen === null) {
      values.push(null);
    }
  }
  if (updates.description !== undefined) {
    sets.push('description = ?');
    values.push(updates.description);
  }
  if (updates.tags !== undefined) {
    sets.push('tags = ?');
    values.push(JSON.stringify(updates.tags));
  }

  if (sets.length === 0) return;

  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`
    UPDATE agents SET ${sets.join(', ')} WHERE id = ?
  `).run(...values);
}

/**
 * Delete agent from database
 */
export function deleteAgent(id: string): void {
  const db = getDatabase();
  
  const agent = db.prepare(`SELECT source FROM agents WHERE id = ?`).get(id) as any;
  if (agent?.source === 'env') {
    throw new Error('Cannot delete environment-sourced agents');
  }

  db.prepare(`DELETE FROM agents WHERE id = ?`).run(id);
}

/**
 * Get selected agent ID
 */
export function getSelectedAgentId(): string | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT agent_id FROM selected_agent WHERE id = 1
  `).get() as { agent_id: string } | undefined;

  return row?.agent_id || null;
}

/**
 * Set selected agent ID
 */
export function setSelectedAgentId(agentId: string): void {
  const db = getDatabase();
  
  db.prepare(`
    INSERT INTO selected_agent (id, agent_id, updated_at)
    VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET 
      agent_id = excluded.agent_id,
      updated_at = CURRENT_TIMESTAMP
  `).run(agentId);
}

/**
 * Get selected agent with fallback
 */
export function getSelectedAgent(): Agent | null {
  const selectedId = getSelectedAgentId();
  
  if (selectedId) {
    const agent = getAgentById(selectedId);
    if (agent) return agent;
  }

  const agents = getAllAgents();
  if (agents.length > 0) {
    setSelectedAgentId(agents[0].id);
    return agents[0];
  }

  return null;
}

// Initialize database and sync env agents on module load
if (typeof window === 'undefined') {
  initDatabase();
  syncEnvAgents();
}