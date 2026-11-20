package com.blink.device.contracts

import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchema
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion

enum class AlertModality(val wireValue: String) {
    AUDIO("audio"),
    HAPTIC("haptic"),
    VISUAL("visual"),
    SILENT_LOG("silent_log");

    companion object {
        fun fromWireValue(value: String): AlertModality? =
            entries.find { it.wireValue == value }
    }
}

data class NudgeConfig(
    val configId: String,
    val revision: Long,
    val lowBlinkRateThreshold: Int,
    val windowDurationSeconds: Int,
    val cooldownSeconds: Int,
    val rule202020Enabled: Boolean,
    val alertModality: String,
    val userId: String? = null,
    val deviceId: String? = null,
    val updatedAt: String,
    val schemaVersion: String = "1.0.0"
)

class NudgeConfigValidator(schemaStream: java.io.InputStream) {
    private val mapper = ObjectMapper()
    private val schema: JsonSchema = schemaStream.use {
        JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7).getSchema(it)
    }

    fun errorsFor(json: String): Set<String> =
        schema.validate(mapper.readTree(json)).map { it.message }.toSet()
}
