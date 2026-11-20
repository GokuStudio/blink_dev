import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const requiredVariables = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_DATABASE_URL",
] as const;

for (const name of requiredVariables) {
  if (!process.env[name]) {
    throw new Error(
      `${name} must be set. Copy .env.example and configure Firebase.`,
    );
  }
}

const firebaseApp =
  getApps()[0] ??
  initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  });

export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);
export const firestore = getFirestore(firebaseApp);

if (process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATORS === "true") {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? "localhost";
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectDatabaseEmulator(database, host, 9000);
  connectFirestoreEmulator(firestore, host, 8081);
}
