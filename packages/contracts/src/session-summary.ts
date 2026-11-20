import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface SessionSummary {
  sessionId: string;
  deviceId: string;
  userId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  totalBlinks: number;
  averageBpm: number;
  minBpm?: number;
  maxBpm?: number;
  nudgeCount: number;
  adherenceScore?: number;
  createdAt?: string;
  schemaVersion: "1.0.0";
}

const schemaUrl = new URL(
  "../schemas/session-summary.v1.schema.json",
  import.meta.url,
);
const schema = JSON.parse(readFileSync(fileURLToPath(schemaUrl), "utf8"));
const ajv = new Ajv({ allErrors: true });
addFormats.default(ajv);
const validate = ajv.compile<SessionSummary>(schema);

export function isSessionSummary(value: unknown): value is SessionSummary {
  return validate(value);
}

export function sessionSummaryErrors(value: unknown): string[] {
  validate(value);
  return (validate.errors ?? []).map(
    (error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
  );
}
