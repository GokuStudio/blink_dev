import type { SessionSummary } from "./session-summary.js";

/**
 * Synchronization state lifecycle for offline records.
 * Keeps transport synchronization metadata decoupled from immutable session measurements.
 */
export type SyncStatus =
  | "LOCAL_ONLY"
  | "PENDING_DEVICE_SYNC"
  | "SYNCED_TO_DEVICE"
  | "PENDING_CLOUD_SYNC"
  | "SYNCED_TO_CLOUD"
  | "SYNC_FAILED";

export interface TransportSyncMetadata {
  syncStatus: SyncStatus;
  retryCount: number;
  lastAttemptedAt: string | null;
  acknowledgedAt: string | null;
  errorMessage: string | null;
}

/**
 * Envelope model combining immutable session measurements with local sync metadata.
 */
export interface SessionRecord {
  session: SessionSummary;
  sync: TransportSyncMetadata;
}
