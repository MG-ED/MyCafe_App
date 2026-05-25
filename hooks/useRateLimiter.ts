// ─── hooks/useRateLimiter.ts ─────────────────────────────────────────────────
// Brute-force / rate-limit protection for login screens.
//
// FIX: Replaced the top-level `import AsyncStorage from "@react-native-async-storage/async-storage"`
// with a cross-platform storage shim that uses localStorage on web and the
// native AsyncStorage on iOS/Android via a dynamic require().
//
// Why this matters:
//   The original top-level import works fine in native builds, but on web with
//   certain Metro/SSR configurations the native AsyncStorage module can fail
//   to resolve during bundle evaluation, crashing login.tsx before it renders.
//   The dynamic require() is gated on Platform.OS so the native path is never
//   even attempted when running in a browser.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = "mycafe:loginAttempts";

// ── Cross-platform storage shim ───────────────────────────────────────────────
const xStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AS = require("@react-native-async-storage/async-storage").default;
    return AS.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* private-mode */
      }
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AS = require("@react-native-async-storage/async-storage").default;
    return AS.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
      } catch {
        /* private-mode */
      }
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AS = require("@react-native-async-storage/async-storage").default;
    return AS.removeItem(key);
  },
};

interface AttemptRecord {
  count: number;
  lockedAt: number | null;
  lastAt: number;
}

function storageKey(email: string): string {
  return `${STORAGE_KEY}:${email.toLowerCase().trim()}`;
}

async function loadRecord(email: string): Promise<AttemptRecord> {
  try {
    const raw = await xStorage.getItem(storageKey(email));
    if (!raw) return { count: 0, lockedAt: null, lastAt: 0 };
    return JSON.parse(raw) as AttemptRecord;
  } catch {
    return { count: 0, lockedAt: null, lastAt: 0 };
  }
}

async function saveRecord(email: string, record: AttemptRecord): Promise<void> {
  try {
    await xStorage.setItem(storageKey(email), JSON.stringify(record));
  } catch {
    // Fail silently — don't crash the app over storage errors
  }
}

async function clearRecord(email: string): Promise<void> {
  try {
    await xStorage.removeItem(storageKey(email));
  } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface RateLimiterState {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
  isLoading: boolean;
}

interface RateLimiter extends RateLimiterState {
  recordFailure: (email: string) => Promise<boolean>;
  recordSuccess: (email: string) => Promise<void>;
  checkLock: (email: string) => Promise<void>;
}

export function useRateLimiter(): RateLimiter {
  const [state, setState] = useState<RateLimiterState>({
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft: MAX_ATTEMPTS,
    isLoading: false,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentEmail = useRef<string>("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = useCallback((lockedAt: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const tick = () => {
      const elapsed = Date.now() - lockedAt;
      const remaining = Math.max(0, LOCKOUT_MS - elapsed);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        clearRecord(currentEmail.current);
        setState({
          isLocked: false,
          remainingSeconds: 0,
          attemptsLeft: MAX_ATTEMPTS,
          isLoading: false,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isLocked: true,
          remainingSeconds: Math.ceil(remaining / 1000),
          attemptsLeft: 0,
        }));
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
  }, []);

  const checkLock = useCallback(
    async (email: string) => {
      if (!email.trim()) return;
      currentEmail.current = email;
      setState((prev) => ({ ...prev, isLoading: true }));
      const record = await loadRecord(email);

      if (record.lockedAt) {
        const elapsed = Date.now() - record.lockedAt;
        if (elapsed < LOCKOUT_MS) {
          startCountdown(record.lockedAt);
          return;
        }
        await clearRecord(email);
      }

      setState({
        isLocked: false,
        remainingSeconds: 0,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - record.count),
        isLoading: false,
      });
    },
    [startCountdown],
  );

  const recordFailure = useCallback(
    async (email: string): Promise<boolean> => {
      currentEmail.current = email;
      const record = await loadRecord(email);

      if (record.lockedAt) {
        const elapsed = Date.now() - record.lockedAt;
        if (elapsed < LOCKOUT_MS) {
          startCountdown(record.lockedAt);
          return true;
        }
        const reset: AttemptRecord = {
          count: 1,
          lockedAt: null,
          lastAt: Date.now(),
        };
        await saveRecord(email, reset);
        setState({
          isLocked: false,
          remainingSeconds: 0,
          attemptsLeft: MAX_ATTEMPTS - 1,
          isLoading: false,
        });
        return false;
      }

      const newCount = record.count + 1;
      if (newCount >= MAX_ATTEMPTS) {
        const lockedAt = Date.now();
        await saveRecord(email, {
          count: newCount,
          lockedAt,
          lastAt: lockedAt,
        });
        startCountdown(lockedAt);
        return true;
      }

      await saveRecord(email, {
        count: newCount,
        lockedAt: null,
        lastAt: Date.now(),
      });
      setState({
        isLocked: false,
        remainingSeconds: 0,
        attemptsLeft: MAX_ATTEMPTS - newCount,
        isLoading: false,
      });
      return false;
    },
    [startCountdown],
  );

  const recordSuccess = useCallback(async (email: string): Promise<void> => {
    await clearRecord(email);
    if (timerRef.current) clearInterval(timerRef.current);
    setState({
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_ATTEMPTS,
      isLoading: false,
    });
  }, []);

  return { ...state, recordFailure, recordSuccess, checkLock };
}

export { MAX_ATTEMPTS };
