import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  isSessionSummary,
  sessionSummaryErrors,
} from "./session-summary.js";

function readExample(filename: string): unknown {
  const url = new URL(`../examples/${filename}`, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
}

test("accepts the versioned valid SessionSummary example", () => {
  const payload = readExample("session-summary.v1.valid.json");

  assert.equal(isSessionSummary(payload), true);
  assert.deepEqual(sessionSummaryErrors(payload), []);
});

test("rejects malformed, out-of-range, and unexpected SessionSummary fields", () => {
  const payload = readExample("session-summary.v1.invalid.json");

  assert.equal(isSessionSummary(payload), false);
  const errors = sessionSummaryErrors(payload);
  assert.ok(errors.length > 0);
  assert.ok(errors.some((e) => e.includes("sessionId") || e.includes("averageBpm") || e.includes("durationSeconds")));
});
