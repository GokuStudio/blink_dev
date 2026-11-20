import { getApps, initializeApp } from "firebase-admin/app";
import { FirebaseAuthError, getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { buildApp } from "./app.js";
import { loadConfig, loadRootEnvironment } from "./config.js";

loadRootEnvironment();
const config = loadConfig(process.env);
const firebaseApp =
  getApps()[0] ??
  initializeApp({
    projectId: config.FIREBASE_PROJECT_ID,
    databaseURL: config.FIREBASE_DATABASE_URL,
  });
const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);
const invalidTokenErrorCodes = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
]);

const app = buildApp({
  authenticate: async (token) => {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      return { uid: decodedToken.uid };
    } catch (error) {
      if (
        error instanceof FirebaseAuthError &&
        invalidTokenErrorCodes.has(error.code)
      ) {
        return null;
      }
      throw error;
    }
  },
  store: {
    async read(uid, deviceId) {
      const snapshot = await database
        .ref(`users/${uid}/devices/${deviceId}/liveState`)
        .get();
      return snapshot.exists() ? snapshot.val() : null;
    },
    async write(uid, deviceId, state) {
      await database
        .ref(`users/${uid}/devices/${deviceId}/liveState`)
        .set(state);
    },
  },
});

await app.listen({ host: "0.0.0.0", port: config.PORT });
