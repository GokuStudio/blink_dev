import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  isLiveDeviceState,
  liveDeviceStateErrors,
} from "./live-device-state.js";

function readExample(filename: string): unknown {
  const url = new URL(`../examples/${filename}`, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
}

test("accepts the versioned valid LiveDeviceState example", () => {
  const payload = readExample("live-device-state.v1.valid.json");

  assert.equal(isLiveDeviceState(payload), true);
  assert.deepEqual(liveDeviceStateErrors(payload), []);
});

test("rejects malformed, out-of-range, and unexpected LiveDeviceState fields", () => {
  const payload = readExample("live-device-state.v1.invalid.json");

  assert.equal(isLiveDeviceState(payload), false);
  assert.ok(liveDeviceStateErrors(payload).length > 0);
});
