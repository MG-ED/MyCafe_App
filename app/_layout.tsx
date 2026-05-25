// ─── app/_layout.tsx ──────────────────────────────────────────────────────────
// FIX: Removed useAuthGuard() entirely.
//
// The original code had TWO independent systems both watching Firebase auth
// state and calling router.replace() simultaneously:
//   1. useAuthGuard() here in the root layout
//   2. The onAuthStateChanged listener in app/index.tsx
//
// On web, when Firebase resolves quickly (no cached session), both effects
// fired in the same tick. Expo Router's web implementation cannot handle two
// competing replace() calls during initial hydration — the router ends up in
// an indeterminate blank state and nothing is rendered.
//
// Navigation responsibility is now clearly split:
//   • app/index.tsx  → shows splash → navigates to /(auth)/welcome or /(tabs)
//   • app/(tabs)/*   → handles tab-level auth (e.g. sign-out redirects)
// ─────────────────────────────────────────────────────────────────────────────

import { CafeProvider } from "@/context/CafeContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// ── Root Error Boundary ───────────────────────────────────────────────────────
// Catches any render-phase exception inside the tree so a crash shows a readable
// message instead of a blank white screen.
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            backgroundColor: "#1A0F08",
          }}
        >
          <Text
            style={{
              color: "#FAF3E0",
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 12,
            }}
          >
            Something went wrong
          </Text>
          <Text style={{ color: "#D4A96A", fontSize: 13, textAlign: "center" }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout() {
  // No useAuthGuard() here — see comment at top of file.
  return (
    <SafeAreaProvider>
      <RootErrorBoundary>
        <CafeProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
        </CafeProvider>
      </RootErrorBoundary>
    </SafeAreaProvider>
  );
}
