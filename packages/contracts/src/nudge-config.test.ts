import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  isNudgeConfig,
  nudgeConfigErrors,
} from "./nudge-config.js";

function readExample(filename: string): unknown {
  const url = new URL(`../examples/${filename}`, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
}

test("accepts the versioned valid NudgeConfig example", () => {
  const payload = readExample("nudge-config.v1.valid.json");

  assert.equal(isNudgeConfig(payload), true);
  assert.deepEqual(nudgeConfigErrors(payload), []);
});

test("rejects malformed, out-of-range, and invalid revision NudgeConfig fields", () => {
  const payload = readExample("nudge-config.v1.invalid.json");

  assert.equal(isNudgeConfig(payload), false);
  const errors = nudgeConfigErrors(payload);
  assert.ok(errors.length > 0);
  assert.ok(errors.some((e) => e.includes("revision") || e.includes("lowBlinkRateThreshold") || e.includes("alertModality")));
});
