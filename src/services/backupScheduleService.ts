/**
 * Database Snapshot & Automated Backup Service for MobiFlow
 *
 * Implements:
 * - Recurring snapshot frequency scheduler (Hourly, Every 4 Hours, Daily, Weekly)
 * - Persistent local snapshot storage in localStorage under isolated tenant keys
 * - Metadata tracking: Timestamp, payload size in KB/MB, item counts (mobiles, sales, etc.)
 * - Automatic retention policy: Prunes old snapshots beyond configured threshold
 * - One-click snapshot restore and manual snapshot creation
 * - Automatic background runner with interval check
 */

import {
  BackupFrequency,
  BackupScheduleSettings,
  DatabaseSnapshotEntry,
} from '../types';

export const SNAPSHOT_STORAGE_KEY_PREFIX = 'mobiflow_db_snapshots_';

export const FREQUENCY_INTERVAL_MS: Record<BackupFrequency, number> = {
  DISABLED: 0,
  HOURLY: 60 * 60 * 1000, // 1 hour
  EVERY_4_HOURS: 4 * 60 * 60 * 1000, // 4 hours
  DAILY: 24 * 60 * 60 * 1000, // 24 hours
  WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const FREQUENCY_LABELS: Record<BackupFrequency, { title: string; desc: string; badge: string }> = {
  DISABLED: {
    title: 'Manual Only (Disabled)',
    desc: 'No automatic snapshots. Only manual backups can be created.',
    badge: 'Manual',
  },
  HOURLY: {
    title: 'Every Hour (High Redundancy)',
    desc: 'Automated snapshot every 60 minutes for high-volume POS shops.',
    badge: '1 Hour',
  },
  EVERY_4_HOURS: {
    title: 'Every 4 Hours (Recommended for Busy Days)',
    desc: 'Automated snapshot four times throughout working hours.',
    badge: '4 Hours',
  },
  DAILY: {
    title: 'Daily (Standard Enterprise)',
    desc: 'Automated snapshot once every 24 hours at the end of business.',
    badge: '24 Hours',
  },
  WEEKLY: {
    title: 'Weekly (Light)',
    desc: 'Automated snapshot created every 7 days.',
    badge: '7 Days',
  },
};

/**
 * Calculate the next scheduled snapshot ISO string based on frequency and baseline time
 */
export function calculateNextSnapshotTime(
  frequency: BackupFrequency,
  fromTime: string = new Date().toISOString()
): string | undefined {
  const interval = FREQUENCY_INTERVAL_MS[frequency];
  if (!interval || interval <= 0) return undefined;
  const baseDate = new Date(fromTime).getTime();
  const nextTime = new Date(baseDate + interval);
  return nextTime.toISOString();
}

/**
 * Checks if a scheduled snapshot is due
 */
export function isSnapshotDue(settings?: BackupScheduleSettings): boolean {
  if (!settings || !settings.enabled || settings.frequency === 'DISABLED') {
    return false;
  }

  const interval = FREQUENCY_INTERVAL_MS[settings.frequency];
  if (!interval || interval <= 0) return false;

  if (!settings.lastSnapshotAt) {
    return true; // Never run before -> due immediately
  }

  const lastTime = new Date(settings.lastSnapshotAt).getTime();
  const now = Date.now();
  return now - lastTime >= interval;
}

/**
 * Loads snapshots for the given tenant from local storage
 */
export function loadTenantSnapshots(tenantId: string = 'default'): DatabaseSnapshotEntry[] {
  try {
    const raw = localStorage.getItem(`${SNAPSHOT_STORAGE_KEY_PREFIX}${tenantId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load local database snapshots:', err);
    return [];
  }
}

/**
 * Saves snapshots array for the tenant, applying pruning limit
 */
export function saveTenantSnapshots(
  tenantId: string = 'default',
  snapshots: DatabaseSnapshotEntry[],
  maxRetained: number = 5
): void {
  try {
    // Keep newest first up to maxRetained
    const pruned = snapshots.slice(0, Math.max(1, maxRetained));
    localStorage.setItem(`${SNAPSHOT_STORAGE_KEY_PREFIX}${tenantId}`, JSON.stringify(pruned));
  } catch (err) {
    console.error('Failed to persist local database snapshots to storage:', err);
  }
}

/**
 * Creates a database snapshot from current export string
 */
export function createSnapshotFromDatabase(
  dbJsonString: string,
  trigger: 'AUTOMATIC' | 'MANUAL' = 'MANUAL'
): DatabaseSnapshotEntry {
  let itemCounts = {
    mobiles: 0,
    sales: 0,
    customers: 0,
    purchases: 0,
  };

  try {
    const parsed = JSON.parse(dbJsonString);
    itemCounts = {
      mobiles: Array.isArray(parsed.mobiles) ? parsed.mobiles.length : 0,
      sales: Array.isArray(parsed.sales) ? parsed.sales.length : 0,
      customers: Array.isArray(parsed.customers) ? parsed.customers.length : 0,
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases.length : 0,
    };
  } catch {
    // Keep fallback zero counts
  }

  const sizeBytes = new Blob([dbJsonString]).size;
  const timestamp = new Date().toISOString();
  const id = `snap-${Date.now()}`;

  return {
    id,
    timestamp,
    sizeBytes,
    itemCounts,
    trigger,
    dataPayload: dbJsonString,
  };
}
