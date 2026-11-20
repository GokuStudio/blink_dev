import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  isDeviceStatus,
  deviceStatusErrors,
} from "./device-status.js";

function readExample(filename: string): unknown {
  const url = new URL(`../examples/${filename}`, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
}

test("accepts the versioned valid DeviceStatus example", () => {
  const payload = readExample("device-status.v1.valid.json");

  assert.equal(isDeviceStatus(payload), true);
  assert.deepEqual(deviceStatusErrors(payload), []);
});

test("rejects unknown enum states and out-of-range DeviceStatus fields", () => {
  const payload = readExample("device-status.v1.invalid.json");

  assert.equal(isDeviceStatus(payload), false);
  const errors = deviceStatusErrors(payload);
  assert.ok(errors.length > 0);
  assert.ok(errors.some((e) => e.includes("availability") || e.includes("cameraState") || e.includes("batteryLevelPercent")));
});
