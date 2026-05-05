// ─── firebase.ts ─────────────────────────────────────────────────────────────
// BUG FIX: initializeAuth() threw "auth/already-initialized" on hot reload
// because getApps() only guards initializeApp(), not initializeAuth().
// Fix: wrap initializeAuth in try/catch and fall back to getAuth() if already
// initialized.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDk8mH0KyPqUrBj5DKTleC1afQD2f_Kx0Y",
  authDomain: "mycafe-pos-b8fbd.firebaseapp.com",
  projectId: "mycafe-pos-b8fbd",
  storageBucket: "mycafe-pos-b8fbd.firebasestorage.app",
  messagingSenderId: "536703139609",
  appId: "1:536703139609:web:bd32c184e3d9d655888f88",
  measurementId: "G-MS30T627NP",
};

// Guard app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// BUG FIX: Guard auth initialization to avoid crash on hot reload
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized — reuse existing instance
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
