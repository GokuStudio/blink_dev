import assert from "node:assert/strict";
import test from "node:test";

const projectId = process.env.FIREBASE_PROJECT_ID ?? "demo-blink";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
const firestoreHost = process.env.FIREBASE_FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8081";
const apiKey = process.env.FIREBASE_WEB_API_KEY ?? "test-api-key";

const authUrl = `http://${authHost}`;
const firestoreBaseUrl = `http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents`;

interface TestUser {
  uid: string;
  token: string;
}

async function createTestUser(): Promise<TestUser> {
  const response = await fetch(
    `${authUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ returnSecureToken: true }),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to create test user in Auth emulator: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { localId: string; idToken: string };
  return { uid: body.localId, token: body.idToken };
}

async function isEmulatorAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`http://${firestoreHost}`, { signal: AbortSignal.timeout(1500) });
    return res.status < 500;
  } catch {
    return false;
  }
}

test("Firestore Security Rules Verification", async (context) => {
  const emulatorRunning = await isEmulatorAvailable();
  if (!emulatorRunning) {
    console.warn(
      `[Firestore Rules Test] Firestore emulator not running at ${firestoreHost}. ` +
      `Start emulators with "npm run emulators" to execute live rule verification.`
    );
    return;
  }

  let userA: TestUser;
  let userB: TestUser;

  await context.test("Create test user identities on Auth emulator", async () => {
    userA = await createTestUser();
    userB = await createTestUser();
    assert.ok(userA.uid && userA.token, "User A successfully provisioned");
    assert.ok(userB.uid && userB.token, "User B successfully provisioned");
    assert.notEqual(userA.uid, userB.uid, "User IDs must be distinct");
  });

  const validSessionPayload = {
    fields: {
      sessionId: { stringValue: "session-test-01" },
      deviceId: { stringValue: "device-01" },
      userId: { stringValue: "" }, // Will set dynamically
      startedAt: { stringValue: "2026-11-20T08:00:00.000Z" },
      endedAt: { stringValue: "2026-11-20T08:30:00.000Z" },
      durationSeconds: { integerValue: "1800" },
      totalBlinks: { integerValue: "420" },
      averageBpm: { doubleValue: 14.0 },
      nudgeCount: { integerValue: "2" },
      schemaVersion: { stringValue: "1.0.0" },
    },
  };

  await context.test("Owner can write a valid session summary", async () => {
    const payload = JSON.parse(JSON.stringify(validSessionPayload));
    payload.fields.userId.stringValue = userA.uid;

    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/sessions?documentId=session-test-01`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${userA.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    assert.equal(res.status, 200, `Expected 200 for owner write, got ${res.status}`);
  });

  await context.test("Owner can read their own session summary", async () => {
    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/sessions/session-test-01`,
      {
        method: "GET",
        headers: { authorization: `Bearer ${userA.token}` },
      },
    );
    assert.equal(res.status, 200, `Expected 200 for owner read, got ${res.status}`);
  });

  await context.test("Cross-user read is denied (User B reading User A)", async () => {
    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/sessions/session-test-01`,
      {
        method: "GET",
        headers: { authorization: `Bearer ${userB.token}` },
      },
    );
    assert.equal(res.status, 403, `Expected 403 for cross-user read, got ${res.status}`);
  });

  await context.test("Cross-user write is denied (User B writing to User A path)", async () => {
    const payload = JSON.parse(JSON.stringify(validSessionPayload));
    payload.fields.userId.stringValue = userA.uid;

    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/sessions?documentId=session-cross-user`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${userB.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    assert.equal(res.status, 403, `Expected 403 for cross-user write, got ${res.status}`);
  });

  await context.test("Unauthenticated write is denied", async () => {
    const payload = JSON.parse(JSON.stringify(validSessionPayload));
    payload.fields.userId.stringValue = userA.uid;

    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/sessions?documentId=session-unauth`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    assert.equal(res.status, 403, `Expected 403 for unauthenticated write, got ${res.status}`);
  });

  await context.test("Rejects session with out-of-bounds averageBpm (> 120)", async () => {
    const payload = JSON.parse(JSON.stringify(validSessionPayload));
    payload.fields.userId.stringValue = userA.uid;
    payload.fields.averageBpm.doubleValue = 150.0; // Exceeds upper limit of 120

    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/sessions?documentId=session-invalid-bpm`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${userA.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    assert.equal(res.status, 403, `Expected 403 for out-of-bounds averageBpm, got ${res.status}`);
  });

  await context.test("Rejects session with unauthorized injected fields", async () => {
    const payload = JSON.parse(JSON.stringify(validSessionPayload));
    payload.fields.userId.stringValue = userA.uid;
    payload.fields.unauthorizedField = { stringValue: "malicious" };

    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/sessions?documentId=session-extra-field`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${userA.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    assert.equal(res.status, 403, `Expected 403 for extra fields, got ${res.status}`);
  });

  await context.test("Rejects update to existing session (sessions are immutable)", async () => {
    const payload = JSON.parse(JSON.stringify(validSessionPayload));
    payload.fields.userId.stringValue = userA.uid;
    payload.fields.totalBlinks.integerValue = "999";

    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/sessions/session-test-01`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${userA.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    assert.equal(res.status, 403, `Expected 403 for immutable session update, got ${res.status}`);
  });

  await context.test("Owner can write and read daily summary", async () => {
    const dailyPayload = {
      fields: {
        date: { stringValue: "2026-11-20" },
        userId: { stringValue: userA.uid },
        totalDurationSeconds: { integerValue: "7200" },
        totalBlinks: { integerValue: "1680" },
        averageBpm: { doubleValue: 14.0 },
        totalNudges: { integerValue: "5" },
        sessionCount: { integerValue: "4" },
        updatedAt: { stringValue: "2026-11-20T10:00:00.000Z" },
        schemaVersion: { stringValue: "1.0.0" },
      },
    };

    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/daily_summaries/2026-11-20`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${userA.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(dailyPayload),
      },
    );
    assert.equal(res.status, 200, `Expected 200 for valid daily summary, got ${res.status}`);
  });

  await context.test("Rejects daily summary with invalid date key format", async () => {
    const dailyPayload = {
      fields: {
        date: { stringValue: "not-a-valid-date" },
        userId: { stringValue: userA.uid },
        totalDurationSeconds: { integerValue: "100" },
        totalBlinks: { integerValue: "50" },
        averageBpm: { doubleValue: 12.0 },
        totalNudges: { integerValue: "0" },
        sessionCount: { integerValue: "1" },
        updatedAt: { stringValue: "2026-11-20T10:00:00.000Z" },
        schemaVersion: { stringValue: "1.0.0" },
      },
    };

    const res = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/daily_summaries/not-a-valid-date`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${userA.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(dailyPayload),
      },
    );
    assert.equal(res.status, 403, `Expected 403 for invalid date format, got ${res.status}`);
  });

  await context.test("Owner can register device and cross-user cannot access it", async () => {
    const devicePayload = {
      fields: {
        deviceId: { stringValue: "device-desk-01" },
        model: { stringValue: "blink-cam-v1" },
        firmwareVersion: { stringValue: "1.0.0" },
        nickname: { stringValue: "Desk Cam" },
        registeredAt: { stringValue: "2026-11-20T08:00:00.000Z" },
        status: { stringValue: "paired" },
      },
    };

    const writeRes = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/devices/device-desk-01`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${userA.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(devicePayload),
      },
    );
    assert.equal(writeRes.status, 200, `Expected 200 for device registration, got ${writeRes.status}`);

    const crossRead = await fetch(
      `${firestoreBaseUrl}/users/${userA.uid}/devices/device-desk-01`,
      {
        method: "GET",
        headers: { authorization: `Bearer ${userB.token}` },
      },
    );
    assert.equal(crossRead.status, 403, `Expected 403 for cross-user device read, got ${crossRead.status}`);
  });
});
