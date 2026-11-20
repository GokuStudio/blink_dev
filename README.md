# Blink

Blink is a two-application eye-wellness system. This repository contains the project foundations and a validated mock live-telemetry flow; camera capture, charts, nudging, and AI integrations are intentionally out of scope.

## Repository layout

- `apps/blink-device` - standalone Kotlin/Jetpack Compose Android build; CameraX, MediaPipe, and shared JSON Schema dependencies are ready for future work.
- `apps/blink-companion` - standalone Expo/React Native TypeScript application with Firebase Authentication, Realtime Database, and Firestore initialization.
- `services/api` - TypeScript/Fastify API, designed for Cloud Run, with an authenticated live-state publisher/subscriber endpoint.
- `packages/contracts` - versioned JSON Schema, example payloads, and TypeScript validation helpers.
- `database.rules.json`, `firestore.rules`, `firebase.json` - authenticated Firebase rules and local emulator configuration.

## Prerequisites

- Node.js 20 or later and npm 10 or later.
- Java 17 or later for Firebase emulators and the Android build.
- Android Studio with Android SDK Platform 35 and the Android build tools.
- Gradle 8.9 or later for the standalone Android project.
- Firebase CLI (included in the root npm development dependencies).

## Install and configure

Run these commands from the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps\blink-companion\.env.example apps\blink-companion\.env
npm install
```

The emulator project uses the reserved `demo-blink` project ID. The Firebase web API key in both environment templates is a placeholder: replace it with a Firebase web-app API key if required by your local Auth setup. API keys are public Firebase project identifiers, not service-account credentials. Do not put service-account keys or other private credentials in either file. The API uses Google Application Default Credentials automatically when deployed to Cloud Run.

Set `ANDROID_HOME` to your installed Android SDK directory if Android Studio has not already configured it. From `apps\blink-companion`, Android emulator traffic uses the default `10.0.2.2` emulator host in its `.env` file. For a physical device, change `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to the development machine's LAN address.

## Start local services

Start the Authentication, Realtime Database, and Firestore emulators in the first terminal:

```powershell
npm run emulators
```

Start the API in a second terminal:

```powershell
npm run dev:api
```

Run the mock publisher and subscriber in two more terminals:

```powershell
npm run dev:publisher
npm run dev:subscriber
```

The publisher and subscriber share one anonymous Auth-emulator identity through the local, Git-ignored `services\api\.blink-demo-auth.json` refresh-token file. The publisher sends schema-validated samples to `POST /v1/devices/{deviceId}/live-state`. The API verifies its Firebase ID token, validates every payload, and stores the latest state at `users/{uid}/devices/{deviceId}/liveState` in Realtime Database. The subscriber polls `GET /v1/devices/{deviceId}/live-state` and validates each received payload. Both scripts run until stopped with Ctrl+C. Visit `http://127.0.0.1:4000` for the emulator UI.

## Run the applications independently

The Android application has its own Gradle settings and can be built without the JavaScript workspace:

```powershell
Set-Location apps\blink-device
gradle :app:testDebugUnitTest :app:assembleDebug
```

The React Native application can be started or built without the Android application's Gradle project:

```powershell
npm run start --workspace=@blink/companion
npm run android --workspace=@blink/companion
```

`expo run:android` requires Android Studio's SDK and an emulator or connected device. The companion's Firebase configuration is read from `apps\blink-companion\.env`; emulator settings are enabled by default.

## Validate and build

Run the shared-contract and API tests, including valid/invalid contract payloads, with:

```powershell
npm run format:check
npm test
```

Build the shared contracts, API, and companion TypeScript projects with:

```powershell
npm run build
```

Kotlin uses the same versioned schema and example payloads as TypeScript. Its focused tests run with `gradle :app:testDebugUnitTest` from `apps\blink-device`; the schema is also packaged into the app's Android assets.

## Firebase data and security

- Realtime Database stores each owner's latest device state under `users/{uid}/devices/{deviceId}/liveState`.
- Firestore is configured for owner-scoped historical `sessions` and `insights`; no historical processing is implemented yet.
- Authentication, Realtime Database, and Firestore rules deny access unless the caller is authenticated as the owning UID. No production service-account credentials are checked in.
- Use a real Firebase project and deployment-specific database URL when deploying. The Cloud Run service listens on `PORT`, verifies Firebase ID tokens, and uses the runtime service account's Application Default Credentials.

## Deploy the API

Build the Cloud Run container from the repository root:

```powershell
docker build -f services/api/Dockerfile -t blink-api .
```

Push the image and deploy it to a configured Google Cloud project after setting `FIREBASE_PROJECT_ID` and `FIREBASE_DATABASE_URL` on the Cloud Run service and granting its runtime service account the required Firebase access:

```powershell
$projectId = (gcloud config get-value project)
$region = "us-central1"
gcloud artifacts repositories create blink --repository-format=docker --location=$region
gcloud builds submit --config cloudbuild.yaml --substitutions "_LOCATION=$region" .
$image = "$region-docker.pkg.dev/$projectId/blink/blink-api"
gcloud run deploy blink-api --image $image --region $region --set-env-vars "FIREBASE_PROJECT_ID=$projectId,FIREBASE_DATABASE_URL=YOUR_FIREBASE_DATABASE_URL"
```
