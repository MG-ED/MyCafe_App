import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
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
export async function uploadImageAsync(
  uri: string,
  destinationPath: string,
): Promise<string> {
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

  return `data:image/jpeg;base64,${manipulated.base64}`;
}

export { auth };
export const db = getFirestore(app);
export default app;
