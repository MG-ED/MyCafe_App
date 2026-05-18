import type { Persistence } from "firebase/auth";

type ReactNativeAsyncStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

// Firebase v12 removed getReactNativePersistence from firebase/auth.
// It now lives in @firebase/auth (resolved to the RN build by Metro).
// This declaration keeps TypeScript happy for both packages.
declare module "@firebase/auth" {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}

// Keep the old augmentation in case any other file still imports from firebase/auth.
declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}
