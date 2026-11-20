import assert from "node:assert/strict";
import test from "node:test";
import type { LiveDeviceState } from "@blink/contracts";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

const validPayload = {
  deviceId: "demo-eye-01",
  observedAt: "2026-11-20T01:00:00.000Z",
  blinkRatePerMinute: 18,
  eyeClosureRatio: 0.12,
  status: "active",
} as const satisfies LiveDeviceState;

test("validates the API environment and applies the default port", () => {
  assert.deepEqual(
    loadConfig({
      FIREBASE_PROJECT_ID: "demo-blink",
      FIREBASE_DATABASE_URL: "http://127.0.0.1:9000?ns=demo-blink",
    }),
    {
      FIREBASE_PROJECT_ID: "demo-blink",
      FIREBASE_DATABASE_URL: "http://127.0.0.1:9000?ns=demo-blink",
      PORT: 8080,
    },
  );
  assert.throws(
    () => loadConfig({ FIREBASE_PROJECT_ID: "demo-blink" }),
    /FIREBASE_DATABASE_URL/,
  );
});

function createTestApp() {
  const stored = new Map<string, LiveDeviceState>();
  const app = buildApp({
    authenticate: async (token) => {
      if (token !== "test-token") {
        return null;
      }
      return { uid: "test-user" };
    },
    store: {
      async read(uid, deviceId) {
        return stored.get(`${uid}/${deviceId}`) ?? null;
      },
      async write(uid, deviceId, state) {
        stored.set(`${uid}/${deviceId}`, state);
      },
    },
  });

  return { app, stored };
}

test("publishes and reads validated live telemetry", async (context) => {
  const { app, stored } = createTestApp();
  context.after(() => app.close());

  const publish = await app.inject({
    method: "POST",
    url: "/v1/devices/demo-eye-01/live-state",
    headers: { authorization: "Bearer test-token" },
    payload: validPayload,
  });

  assert.equal(publish.statusCode, 200);
  assert.deepEqual(stored.get("test-user/demo-eye-01"), validPayload);

  const read = await app.inject({
    method: "GET",
    url: "/v1/devices/demo-eye-01/live-state",
    headers: { authorization: "Bearer test-token" },
  });

  assert.equal(read.statusCode, 200);
  assert.deepEqual(read.json().data, validPayload);
});

test("rejects invalid payloads, mismatched device IDs, and missing authentication", async (context) => {
  const { app, stored } = createTestApp();
  context.after(() => app.close());

  const invalid = await app.inject({
    method: "POST",
    url: "/v1/devices/demo-eye-01/live-state",
    headers: { authorization: "Bearer test-token" },
    payload: { ...validPayload, blinkRatePerMinute: 121 },
  });
  assert.equal(invalid.statusCode, 400);
  assert.equal(stored.size, 0);

  const mismatched = await app.inject({
    method: "POST",
    url: "/v1/devices/other-device/live-state",
    headers: { authorization: "Bearer test-token" },
    payload: validPayload,
  });
  assert.equal(mismatched.statusCode, 400);

  const unauthenticated = await app.inject({
    method: "POST",
    url: "/v1/devices/demo-eye-01/live-state",
    payload: validPayload,
  });
  assert.equal(unauthenticated.statusCode, 401);

  const invalidToken = await app.inject({
    method: "GET",
    url: "/v1/devices/demo-eye-01/live-state",
    headers: { authorization: "Bearer invalid-token" },
  });
  assert.equal(invalidToken.statusCode, 401);
});
