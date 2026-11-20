import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type DeviceAvailability = "available" | "busy" | "offline" | "maintenance";
export type MonitoringState = "idle" | "calibrating" | "monitoring" | "paused";
export type FaceDetectionState = "face_detected" | "face_not_detected" | "multiple_faces" | "low_confidence";
export type CameraState = "ready" | "streaming" | "permission_denied" | "sensor_error" | "closed";
export type ConnectionHealth = "connected" | "connecting" | "disconnected" | "reconnecting" | "degraded";

export interface DeviceStatus {
  deviceId: string;
  reportedAt: string;
  availability: DeviceAvailability;
  monitoringState: MonitoringState;
  faceDetectionState: FaceDetectionState;
  cameraState: CameraState;
  connectionHealth: ConnectionHealth;
  batteryLevelPercent?: number;
  firmwareVersion?: string;
  errorMessage?: string;
  schemaVersion: "1.0.0";
}

const schemaUrl = new URL(
  "../schemas/device-status.v1.schema.json",
  import.meta.url,
);
const schema = JSON.parse(readFileSync(fileURLToPath(schemaUrl), "utf8"));
const ajv = new Ajv({ allErrors: true });
addFormats.default(ajv);
const validate = ajv.compile<DeviceStatus>(schema);

export function isDeviceStatus(value: unknown): value is DeviceStatus {
  return validate(value);
}

export function deviceStatusErrors(value: unknown): string[] {
  validate(value);
  return (validate.errors ?? []).map(
    (error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
  );
}
