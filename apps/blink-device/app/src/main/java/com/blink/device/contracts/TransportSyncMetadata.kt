package com.blink.device.contracts

enum class SyncStatus {
    LOCAL_ONLY,
    PENDING_DEVICE_SYNC,
    SYNCED_TO_DEVICE,
    PENDING_CLOUD_SYNC,
    SYNCED_TO_CLOUD,
    SYNC_FAILED
}

data class TransportSyncMetadata(
    val syncStatus: SyncStatus,
    val retryCount: Int = 0,
    val lastAttemptedAt: String? = null,
    val acknowledgedAt: String? = null,
    val errorMessage: String? = null
)

data class SessionRecord(
    val session: SessionSummary,
    val sync: TransportSyncMetadata
)
