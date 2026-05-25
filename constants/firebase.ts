// ─── constants/firebase.ts ────────────────────────────────────────────────────
// FIXES APPLIED:
//
// 1. REMOVED top-level `import * as ImageManipulator from "expo-image-manipulator"`
//    It is now a lazy require() INSIDE uploadImageAsync.
//    Why: A static top-level import is evaluated synchronously when the module
//    is first loaded. On web, expo-image-manipulator can fail to resolve in
//    certain Metro/SSR bundling passes, crashing firebase.ts — which is imported
//    by _layout.tsx — before React even mounts. This was causing the blank
//    white/gray screen.
//
// 2. ADDED .trim() to every process.env value.
//    The .env file had leading spaces on every value (e.g. " AIzaSy...").
//    Firebase SDK treats " AIzaSy..." and "AIzaSy..." as different strings —
//    the spaced version is an invalid API key, causing Firebase to throw
//    "auth/invalid-api-key" and crash auth entirely.
//    .trim() ensures clean values even if the .env is mis-formatted.
// ─────────────────────────────────────────────────────────────────────────────

import { getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadString,
} from "firebase/storage";
import { Platform } from "react-native";

// FIX: .trim() guards against leading/trailing whitespace in .env values.
// Without trim(), " AIzaSy..." is passed to Firebase as-is → invalid-api-key crash.
const firebaseConfig = {
  apiKey: (process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "").trim(),
  authDomain: (process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "").trim(),
  projectId: (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "").trim(),
  storageBucket: (process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim(),
  messagingSenderId: (
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? ""
  ).trim(),
  appId: (process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "").trim(),
  measurementId: (process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "").trim(),
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "[MyCAFE] Firebase config is missing. " +
      "Copy .env.example → .env and fill in your Firebase credentials. " +
      "See README.md for instructions.",
  );
}

// Guard app initialization (hot-reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// FIX: Do NOT import AsyncStorage / getReactNativePersistence at the top level.
// expo-router's SSR renderer (render.js) runs in Node.js, which cannot resolve
// the native AsyncStorage module. Dynamic require() inside a Platform.OS guard
// means the native path is never evaluated on web.
let auth: Auth;
try {
  if (Platform.OS === "web") {
    // Web: browser localStorage / in-memory persistence — no AsyncStorage needed
    auth = getAuth(app);
  } else {
    // Native (iOS / Android): AsyncStorage-backed persistence
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require("firebase/auth");
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch {
  // Already initialized — reuse the existing instance (hot-reload safe)
  auth = getAuth(app);
}

// ── uploadImageAsync ──────────────────────────────────────────────────────────
// FIX: expo-image-manipulator is now a lazy require() inside this function.
// Previously it was a static top-level import; any failure during module
// evaluation would crash the entire firebase.ts module (and therefore _layout.tsx)
// before React mounted, causing a blank white screen on web.
export async function uploadImageAsync(
  uri: string,
  destinationPath: string,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ImageManipulator = require("expo-image-manipulator");

  const isProfilePic = destinationPath.startsWith("profilePics/");

  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: isProfilePic ? 400 : 800 } }],
    {
      compress: isProfilePic ? 0.7 : 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!manipulated.base64) {
    throw new Error("Image encoding failed: base64 output is empty.");
  }

  const storage = getStorage(app);
  const storageRef = ref(storage, destinationPath);

  await uploadString(storageRef, manipulated.base64, "base64", {
    contentType: "image/jpeg",
  });

  return getDownloadURL(storageRef);
}

export { auth };
export const db = getFirestore(app);
export default app;
