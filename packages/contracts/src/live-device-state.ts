import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface LiveDeviceState {
  deviceId: string;
  observedAt: string;
  blinkRatePerMinute: number;
  eyeClosureRatio: number;
  status: "active" | "inactive";
}

const schemaUrl = new URL(
  "../schemas/live-device-state.v1.schema.json",
  import.meta.url,
);
const schema = JSON.parse(readFileSync(fileURLToPath(schemaUrl), "utf8"));
const ajv = new Ajv({ allErrors: true });
addFormats.default(ajv);
const validate = ajv.compile<LiveDeviceState>(schema);

export function isLiveDeviceState(value: unknown): value is LiveDeviceState {
  return validate(value);
}

export function liveDeviceStateErrors(value: unknown): string[] {
  validate(value);
  return (validate.errors ?? []).map(
    (error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
  );
}
