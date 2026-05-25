// ─── app/index.tsx ────────────────────────────────────────────────────────────
// FIXES APPLIED:
//
// 1. `splashDoneRef` (useRef) → `splashDone` (useState).
//    A ref mutation (splashDoneRef.current = true) does NOT trigger a re-render.
//    That meant the render guard `if (!splashDoneRef.current)` always returned
//    the same result — the component was frozen showing the invisible (faded-out)
//    SplashScreen even after navigation should have happened, leaving a white
//    screen. With useState, setting splashDone = true forces a re-render so the
//    dark fallback View is shown while auth resolves, and null after nav fires.
//
// 2. Safety timeout is now unconditional (no `authUser` in dependency array).
//    The original timer reset every time authUser changed, meaning if Firebase
//    resolved fast (< 5 s, as it always does on web with no session) the timer
//    restarted from 0. With an empty dep array the timer runs exactly once from
//    mount and fires after 5 s regardless of auth state — guaranteeing the user
//    is never stuck on a blank screen.
// ─────────────────────────────────────────────────────────────────────────────

import SplashScreen from "@/components/SplashScreen";
import { auth } from "@/constants/firebase";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";

export default function Index() {
  const router = useRouter();

  // undefined = Firebase hasn't fired yet | true/false = result
  const [authUser, setAuthUser] = useState<boolean | undefined>(undefined);

  // FIX: useState instead of useRef — mutation triggers re-render
  const [splashDone, setSplashDone] = useState(false);

  // Prevent calling navigate() more than once
  const navigatedRef = useRef(false);

  // ── Firebase auth listener ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(!!user);
    });
    return unsub;
  }, []);

  // ── Navigate helper (idempotent) ───────────────────────────────────────
  const navigate = useCallback(
    (authenticated: boolean) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      router.replace(authenticated ? "/(tabs)" : "/(auth)/welcome");
    },
    [router],
  );

  // ── Navigate once BOTH splash is done AND auth has resolved ───────────
  useEffect(() => {
    if (splashDone && authUser !== undefined) {
      navigate(authUser);
    }
  }, [splashDone, authUser, navigate]);

  // ── Splash finish callback ─────────────────────────────────────────────
  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
    // If auth already resolved while the splash was playing, navigate now
    if (authUser !== undefined) {
      navigate(authUser);
    }
  }, [authUser, navigate]);

  // ── Safety timeout (runs once, unconditional) ──────────────────────────
  // FIX: empty dep array — timer is NOT reset when authUser changes.
  // Guarantees the user is never stuck on a blank screen for more than 5 s
  // even if Firebase fails to respond.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!navigatedRef.current) {
        navigate(authUser ?? false);
      }
    }, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────
  if (!splashDone) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Splash done but auth is still pending — dark background to avoid flicker
  if (authUser === undefined) {
    return <View style={{ flex: 1, backgroundColor: "#2C1A0E" }} />;
  }

  // Auth resolved — navigate() was called in the useEffect above
  return null;
}
