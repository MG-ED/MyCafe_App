// ─── hooks/useRateLimiter.ts ─────────────────────────────────────────────────
// Brute-force / rate-limit protection using AsyncStorage.
// Tracks failed login attempts per email.
// After MAX_ATTEMPTS failures → lockout for LOCKOUT_MS milliseconds.
// Uses exponential backoff between attempts.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_ATTEMPTS  = 5;          // failures before lockout
const LOCKOUT_MS    = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY   = "mycafe:loginAttempts";

interface AttemptRecord {
  count:     number;
  lockedAt:  number | null;   // timestamp when lockout began
  lastAt:    number;          // timestamp of last attempt
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function storageKey(email: string): string {
  return `${STORAGE_KEY}:${email.toLowerCase().trim()}`;
}

async function loadRecord(email: string): Promise<AttemptRecord> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(email));
    if (!raw) return { count: 0, lockedAt: null, lastAt: 0 };
    return JSON.parse(raw) as AttemptRecord;
  } catch {
    return { count: 0, lockedAt: null, lastAt: 0 };
  }
}

async function saveRecord(email: string, record: AttemptRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(email), JSON.stringify(record));
  } catch {
    // Fail silently — don't crash the app over storage errors
  }
}

async function clearRecord(email: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(email));
  } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface RateLimiterState {
  isLocked:         boolean;
  remainingSeconds: number;
  attemptsLeft:     number;
  isLoading:        boolean;
}

interface RateLimiter extends RateLimiterState {
  /** Call AFTER a failed authentication attempt. Returns whether locked. */
  recordFailure: (email: string) => Promise<boolean>;
  /** Call AFTER a successful authentication attempt to clear the record. */
  recordSuccess: (email: string) => Promise<void>;
  /** Check current lock state for an email (e.g. when email field blurs). */
  checkLock:     (email: string) => Promise<void>;
}

export function useRateLimiter(): RateLimiter {
  const [state, setState] = useState<RateLimiterState>({
    isLocked:         false,
    remainingSeconds: 0,
    attemptsLeft:     MAX_ATTEMPTS,
    isLoading:        false,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentEmail = useRef<string>("");

  // Clear countdown timer on unmount
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
      const remainingSeconds = Math.ceil(remaining / 1000);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        clearRecord(currentEmail.current);
        setState({
          isLocked:         false,
          remainingSeconds: 0,
          attemptsLeft:     MAX_ATTEMPTS,
          isLoading:        false,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isLocked:         true,
          remainingSeconds,
          attemptsLeft:     0,
        }));
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
  }, []);

  const checkLock = useCallback(async (email: string) => {
    if (!email.trim()) return;
    currentEmail.current = email;

    setState((prev) => ({ ...prev, isLoading: true }));
    const record = await loadRecord(email);

    if (record.lockedAt) {
      const elapsed = Date.now() - record.lockedAt;
      if (elapsed < LOCKOUT_MS) {
        startCountdown(record.lockedAt);
        return;
      } else {
        // Lockout expired — clear it
        await clearRecord(email);
        setState({
          isLocked:         false,
          remainingSeconds: 0,
          attemptsLeft:     MAX_ATTEMPTS,
          isLoading:        false,
        });
        return;
      }
    }

    setState({
      isLocked:         false,
      remainingSeconds: 0,
      attemptsLeft:     Math.max(0, MAX_ATTEMPTS - record.count),
      isLoading:        false,
    });
  }, [startCountdown]);

  const recordFailure = useCallback(async (email: string): Promise<boolean> => {
    currentEmail.current = email;
    const record = await loadRecord(email);

    // If already locked, don't increment
    if (record.lockedAt) {
      const elapsed = Date.now() - record.lockedAt;
      if (elapsed < LOCKOUT_MS) {
        startCountdown(record.lockedAt);
        return true;
      }
      // Lockout expired, reset
      const reset: AttemptRecord = { count: 1, lockedAt: null, lastAt: Date.now() };
      await saveRecord(email, reset);
      setState({
        isLocked:         false,
        remainingSeconds: 0,
        attemptsLeft:     MAX_ATTEMPTS - 1,
        isLoading:        false,
      });
      return false;
    }

    const newCount = record.count + 1;

    if (newCount >= MAX_ATTEMPTS) {
      const lockedAt = Date.now();
      await saveRecord(email, { count: newCount, lockedAt, lastAt: lockedAt });
      startCountdown(lockedAt);
      return true;
    }

    await saveRecord(email, { count: newCount, lockedAt: null, lastAt: Date.now() });
    setState({
      isLocked:         false,
      remainingSeconds: 0,
      attemptsLeft:     MAX_ATTEMPTS - newCount,
      isLoading:        false,
    });
    return false;
  }, [startCountdown]);

  const recordSuccess = useCallback(async (email: string): Promise<void> => {
    await clearRecord(email);
    if (timerRef.current) clearInterval(timerRef.current);
    setState({
      isLocked:         false,
      remainingSeconds: 0,
      attemptsLeft:     MAX_ATTEMPTS,
      isLoading:        false,
    });
  }, []);

  return { ...state, recordFailure, recordSuccess, checkLock };
}

export { MAX_ATTEMPTS };
