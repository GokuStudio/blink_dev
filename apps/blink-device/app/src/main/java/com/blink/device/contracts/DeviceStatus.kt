package com.blink.device.contracts

import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchema
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion

enum class DeviceAvailability(val wireValue: String) {
    AVAILABLE("available"),
    BUSY("busy"),
    OFFLINE("offline"),
    MAINTENANCE("maintenance");

    companion object {
        fun fromWireValue(value: String): DeviceAvailability? =
            entries.find { it.wireValue == value }
    }
}

enum class MonitoringState(val wireValue: String) {
    IDLE("idle"),
    CALIBRATING("calibrating"),
    MONITORING("monitoring"),
    PAUSED("paused");

    companion object {
        fun fromWireValue(value: String): MonitoringState? =
            entries.find { it.wireValue == value }
    }
}

enum class FaceDetectionState(val wireValue: String) {
    FACE_DETECTED("face_detected"),
    FACE_NOT_DETECTED("face_not_detected"),
    MULTIPLE_FACES("multiple_faces"),
    LOW_CONFIDENCE("low_confidence");

    companion object {
        fun fromWireValue(value: String): FaceDetectionState? =
            entries.find { it.wireValue == value }
    }
}

enum class CameraState(val wireValue: String) {
    READY("ready"),
    STREAMING("streaming"),
    PERMISSION_DENIED("permission_denied"),
    SENSOR_ERROR("sensor_error"),
    CLOSED("closed");

    companion object {
        fun fromWireValue(value: String): CameraState? =
            entries.find { it.wireValue == value }
    }
}

enum class ConnectionHealth(val wireValue: String) {
    CONNECTED("connected"),
    CONNECTING("connecting"),
    DISCONNECTED("disconnected"),
    RECONNECTING("reconnecting"),
    DEGRADED("degraded");

    companion object {
        fun fromWireValue(value: String): ConnectionHealth? =
            entries.find { it.wireValue == value }
    }
}

data class DeviceStatus(
    val deviceId: String,
    val reportedAt: String,
    val availability: String,
    val monitoringState: String,
    val faceDetectionState: String,
    val cameraState: String,
    val connectionHealth: String,
    val batteryLevelPercent: Int? = null,
    val firmwareVersion: String? = null,
    val errorMessage: String? = null,
    val schemaVersion: String = "1.0.0"
)

class DeviceStatusValidator(schemaStream: java.io.InputStream) {
    private val mapper = ObjectMapper()
    private val schema: JsonSchema = schemaStream.use {
        JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7).getSchema(it)
    }

    fun errorsFor(json: String): Set<String> =
        schema.validate(mapper.readTree(json)).map { it.message }.toSet()
}
