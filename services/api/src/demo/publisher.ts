import { isLiveDeviceState } from "@blink/contracts";
import { getDemoIdToken } from "./firebase-client.js";

const apiBaseUrl = process.env.API_BASE_URL;
const deviceId = process.env.DEMO_DEVICE_ID;
if (!apiBaseUrl || !deviceId) {
  throw new Error("API_BASE_URL and DEMO_DEVICE_ID must be configured.");
}

const idToken = await getDemoIdToken();
let sequence = 0;
console.info(`Publishing mock telemetry for ${deviceId} to ${apiBaseUrl}`);

for (;;) {
  const state = {
    deviceId,
    observedAt: new Date().toISOString(),
    blinkRatePerMinute: 14 + (sequence % 9),
    eyeClosureRatio: Number((0.08 + (sequence % 5) * 0.03).toFixed(2)),
    status: "active" as const,
  };
  if (!isLiveDeviceState(state)) {
    throw new Error("Generated telemetry did not match LiveDeviceState.");
  }

  const response = await fetch(
    `${apiBaseUrl}/v1/devices/${encodeURIComponent(deviceId)}/live-state`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(state),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Telemetry publish failed (${response.status}): ${await response.text()}`,
    );
  }

  console.info(`Published ${state.observedAt}`);
  sequence += 1;
  await new Promise((resolve) => setTimeout(resolve, 5_000));
}
