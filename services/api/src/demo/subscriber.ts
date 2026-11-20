import { isLiveDeviceState } from "@blink/contracts";
import { getDemoIdToken } from "./firebase-client.js";

const apiBaseUrl = process.env.API_BASE_URL;
const deviceId = process.env.DEMO_DEVICE_ID;
if (!apiBaseUrl || !deviceId) {
  throw new Error("API_BASE_URL and DEMO_DEVICE_ID must be configured.");
}

const idToken = await getDemoIdToken();
console.info(`Reading mock telemetry for ${deviceId} from ${apiBaseUrl}`);

for (;;) {
  const response = await fetch(
    `${apiBaseUrl}/v1/devices/${encodeURIComponent(deviceId)}/live-state`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );

  if (response.status === 404) {
    console.info("Waiting for the first telemetry sample.");
  } else if (!response.ok) {
    throw new Error(
      `Telemetry read failed (${response.status}): ${await response.text()}`,
    );
  } else {
    const result: unknown = await response
      .json()
      .then((body: { data?: unknown }) => body.data);
    if (!isLiveDeviceState(result)) {
      throw new Error("Received telemetry that did not match LiveDeviceState.");
    }
    console.info(JSON.stringify(result));
  }

  await new Promise((resolve) => setTimeout(resolve, 2_000));
}
