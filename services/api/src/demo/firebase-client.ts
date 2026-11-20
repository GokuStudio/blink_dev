import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadRootEnvironment } from "../config.js";

interface EmulatorSession {
  refreshToken: string;
}

interface AuthResponse {
  idToken: string;
  refreshToken?: string;
}

const requiredVariables = [
  "FIREBASE_WEB_API_KEY",
  "FIREBASE_AUTH_EMULATOR_HOST",
] as const;

loadRootEnvironment();
const webApiKey = process.env.FIREBASE_WEB_API_KEY;
const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
for (const name of requiredVariables) {
  if (!process.env[name]) {
    throw new Error(`${name} must be set before running the telemetry demo.`);
  }
}

if (!webApiKey || !authEmulatorHost) {
  throw new Error("Firebase emulator configuration is incomplete.");
}

const apiKey = encodeURIComponent(webApiKey);
const authEmulatorUrl = `http://${authEmulatorHost}`;
const sessionPath = resolve(".blink-demo-auth.json");

async function authResponse(response: Response): Promise<AuthResponse> {
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      `Firebase Auth emulator request failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("idToken" in body || "id_token" in body) ||
    !("refreshToken" in body || "refresh_token" in body)
  ) {
    throw new Error(
      "Firebase Auth emulator returned an invalid token response.",
    );
  }
  const idToken = "idToken" in body ? body.idToken : body.id_token;
  const refreshToken =
    "refreshToken" in body ? body.refreshToken : body.refresh_token;
  if (
    typeof idToken !== "string" ||
    (refreshToken !== undefined && typeof refreshToken !== "string")
  ) {
    throw new Error("Firebase Auth emulator returned invalid tokens.");
  }
  return {
    idToken,
    ...(typeof refreshToken === "string" ? { refreshToken } : {}),
  };
}

async function readSession(): Promise<EmulatorSession> {
  try {
    const stored: unknown = JSON.parse(await readFile(sessionPath, "utf8"));
    if (
      typeof stored === "object" &&
      stored !== null &&
      "refreshToken" in stored &&
      typeof stored.refreshToken === "string"
    ) {
      return { refreshToken: stored.refreshToken };
    }
    throw new Error(`Local emulator session at ${sessionPath} is malformed.`);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      const response = await fetch(
        `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ returnSecureToken: true }),
        },
      );
      const session = await authResponse(response);
      if (!session.refreshToken) {
        throw new Error(
          "Firebase Auth emulator did not return a refresh token.",
        );
      }
      await writeFile(
        sessionPath,
        JSON.stringify({ refreshToken: session.refreshToken }),
        { mode: 0o600 },
      );
      return { refreshToken: session.refreshToken };
    }
    throw error;
  }
}

export async function getDemoIdToken(): Promise<string> {
  const session = await readSession();
  const response = await fetch(
    `${authEmulatorUrl}/securetoken.googleapis.com/v1/token?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
      }),
    },
  );
  return (await authResponse(response)).idToken;
}
