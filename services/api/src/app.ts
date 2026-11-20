import type { LiveDeviceState } from "@blink/contracts";
import { isLiveDeviceState, liveDeviceStateErrors } from "@blink/contracts";
import Fastify from "fastify";

export interface LiveStateStore {
  read(uid: string, deviceId: string): Promise<LiveDeviceState | null>;
  write(uid: string, deviceId: string, state: LiveDeviceState): Promise<void>;
}

export interface AppDependencies {
  authenticate(token: string): Promise<{ uid: string } | null>;
  store: LiveStateStore;
}

export function buildApp(dependencies: AppDependencies) {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  app.route<{ Params: { deviceId: string }; Body: unknown }>({
    method: ["GET", "POST"],
    url: "/v1/devices/:deviceId/live-state",
    handler: async (request, reply) => {
      const authorization = request.headers.authorization;
      const [scheme, token, ...extra] = authorization?.split(" ") ?? [];

      if (scheme?.toLowerCase() !== "bearer" || !token || extra.length > 0) {
        return reply.code(401).send({ error: "Bearer token required" });
      }

      const user = await dependencies.authenticate(token);
      if (!user) {
        return reply.code(401).send({ error: "Invalid bearer token" });
      }

      if (request.method === "GET") {
        const state = await dependencies.store.read(
          user.uid,
          request.params.deviceId,
        );
        if (!state) {
          return reply.code(404).send({ error: "Live device state not found" });
        }
        if (
          !isLiveDeviceState(state) ||
          state.deviceId !== request.params.deviceId
        ) {
          request.log.error(
            { deviceId: request.params.deviceId },
            "Stored live device state failed contract validation",
          );
          return reply
            .code(500)
            .send({ error: "Stored live device state is invalid" });
        }
        return { data: state };
      }

      if (!isLiveDeviceState(request.body)) {
        return reply.code(400).send({
          error: "Invalid LiveDeviceState",
          details: liveDeviceStateErrors(request.body),
        });
      }

      if (request.body.deviceId !== request.params.deviceId) {
        return reply.code(400).send({
          error: "Payload deviceId must match the requested device",
        });
      }

      await dependencies.store.write(
        user.uid,
        request.params.deviceId,
        request.body,
      );
      return reply.code(200).send({ data: request.body });
    },
  });

  return app;
}
