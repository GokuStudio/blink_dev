package com.blink.device.contracts

import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchema
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion

data class SessionSummary(
    val sessionId: String,
    val deviceId: String,
    val userId: String,
    val startedAt: String,
    val endedAt: String,
    val durationSeconds: Long,
    val totalBlinks: Long,
    val averageBpm: Double,
    val minBpm: Int? = null,
    val maxBpm: Int? = null,
    val nudgeCount: Long,
    val adherenceScore: Double? = null,
    val createdAt: String? = null,
    val schemaVersion: String = "1.0.0"
)

class SessionSummaryValidator(schemaStream: java.io.InputStream) {
    private val mapper = ObjectMapper()
    private val schema: JsonSchema = schemaStream.use {
        JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7).getSchema(it)
    }

    fun errorsFor(json: String): Set<String> =
        schema.validate(mapper.readTree(json)).map { it.message }.toSet()
}
