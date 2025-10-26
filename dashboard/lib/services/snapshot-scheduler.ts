// Snapshot Scheduler Service
// Periodically creates metric snapshots for all configured intervals

import { AlertInterval } from '../types/alerting';
import { TraefikLog } from '../types';
import { createSnapshotsForIntervals } from './metric-snapshot-service';
import { saveMetricSnapshot } from '../db/database';

/**
 * Interval durations in milliseconds
 */
const intervalDurations: Record<AlertInterval, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

/**
 * Track last snapshot creation time for each interval
 */
const lastSnapshotTimes = new Map<string, number>();

/**
 * Snapshot Scheduler
 * Creates metric snapshots at configured intervals
 */
export class SnapshotScheduler {
  private isRunning = false;
  private intervals: AlertInterval[] = ['5m', '15m', '30m', '1h', '6h', '12h', '24h'];

  /**
   * Process logs and create snapshots if needed
   * @param agentId - Agent identifier
   * @param agentName - Agent name
   * @param logs - All available logs
   */
  async processLogs(
    agentId: string,
    agentName: string,
    logs: TraefikLog[]
  ): Promise<void> {
    if (this.isRunning) {
      console.log('Snapshot creation already in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const now = Date.now();
      const intervalsToSnapshot: AlertInterval[] = [];

      // Check which intervals need new snapshots
      for (const interval of this.intervals) {
        const key = `${agentId}-${interval}`;
        const lastTime = lastSnapshotTimes.get(key);
        const intervalMs = intervalDurations[interval];

        // Create snapshot if:
        // 1. Never created before, OR
        // 2. Enough time has passed since last snapshot
        if (!lastTime || now - lastTime >= intervalMs) {
          intervalsToSnapshot.push(interval);
        }
      }

      if (intervalsToSnapshot.length === 0) {
        return;
      }

      console.log(
        `Creating snapshots for agent ${agentName} (${agentId}): ${intervalsToSnapshot.join(', ')}`
      );

      // Create snapshots for all intervals that need updating
      const snapshots = createSnapshotsForIntervals(
        logs,
        agentId,
        agentName,
        intervalsToSnapshot
      );

      // Save snapshots to database
      for (const snapshot of snapshots) {
        try {
          saveMetricSnapshot(snapshot);
          const key = `${agentId}-${snapshot.interval}`;
          lastSnapshotTimes.set(key, now);

          console.log(
            `✓ Created snapshot for interval ${snapshot.interval}: ${snapshot.log_count} logs from ${snapshot.window_start} to ${snapshot.window_end}`
          );
        } catch (error) {
          console.error(`Failed to save snapshot for ${snapshot.interval}:`, error);
        }
      }
    } catch (error) {
      console.error('Error creating snapshots:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Set which intervals to create snapshots for
   * @param intervals - List of intervals to monitor
   */
  setIntervals(intervals: AlertInterval[]): void {
    this.intervals = intervals;
  }

  /**
   * Reset snapshot times (useful for testing)
   */
  resetSnapshotTimes(): void {
    lastSnapshotTimes.clear();
  }

  /**
   * Get last snapshot time for an agent and interval
   */
  getLastSnapshotTime(agentId: string, interval: AlertInterval): number | undefined {
    const key = `${agentId}-${interval}`;
    return lastSnapshotTimes.get(key);
  }
}

// Singleton instance
export const snapshotScheduler = new SnapshotScheduler();
