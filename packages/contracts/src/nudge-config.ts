import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type AlertModality = "audio" | "haptic" | "visual" | "silent_log";

export interface NudgeConfig {
  configId: string;
  revision: number;
  lowBlinkRateThreshold: number;
  windowDurationSeconds: number;
  cooldownSeconds: number;
  rule202020Enabled: boolean;
  alertModality: AlertModality;
  userId?: string;
  deviceId?: string;
  updatedAt: string;
  schemaVersion: "1.0.0";
}

const schemaUrl = new URL(
  "../schemas/nudge-config.v1.schema.json",
  import.meta.url,
);
const schema = JSON.parse(readFileSync(fileURLToPath(schemaUrl), "utf8"));
const ajv = new Ajv({ allErrors: true });
addFormats.default(ajv);
const validate = ajv.compile<NudgeConfig>(schema);

export function isNudgeConfig(value: unknown): value is NudgeConfig {
  return validate(value);
}

export function nudgeConfigErrors(value: unknown): string[] {
  validate(value);
  return (validate.errors ?? []).map(
    (error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
  );
}
