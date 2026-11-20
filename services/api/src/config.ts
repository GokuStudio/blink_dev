import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

let rootEnvironmentLoaded = false;

export function loadRootEnvironment(): void {
  if (!rootEnvironmentLoaded) {
    dotenv.config({
      path: fileURLToPath(new URL("../../../.env", import.meta.url)),
    });
    rootEnvironmentLoaded = true;
  }
}

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_DATABASE_URL: z.string().url(),
});

export type ApiConfig = z.infer<typeof configSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv): ApiConfig {
  return configSchema.parse(environment);
}
