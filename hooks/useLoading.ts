/**
 * useLoading.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight hook to manage async loading states, messages, and errors.
 *
 * Usage:
 *   const { isLoading, message, error, run } = useLoading();
 *
 *   // Wrap any async operation:
 *   await run(fetchProducts(), 'Loading menu…');
 *
 *   // Then use in JSX:
 *   <LoadingOverlay visible={isLoading} message={message} />
 *   {error && <ErrorBanner message={error} />}
 */

import { useState, useCallback } from 'react';
import type { LoadingMessage } from '../components/loading/LoadingOverlay';

interface UseLoadingReturn {
  isLoading: boolean;
  message: string;
  error: string | null;
  run: <T>(
    promise: Promise<T>,
    msg?: LoadingMessage | string
  ) => Promise<T | undefined>;
  setLoading: (loading: boolean, msg?: string) => void;
  clearError: () => void;
}

export function useLoading(
  defaultMessage: LoadingMessage | string = 'Brewing your experience…'
): UseLoadingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [message,   setMessage  ] = useState<string>(defaultMessage);
  const [error,     setError    ] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean, msg?: string) => {
    setIsLoading(loading);
    if (msg) setMessage(msg);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(
    async <T,>(
      promise: Promise<T>,
      msg: LoadingMessage | string = defaultMessage
    ): Promise<T | undefined> => {
      setIsLoading(true);
      setMessage(msg);
      setError(null);
      try {
        const result = await promise;
        return result;
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : 'Something went wrong. Please try again.';
        setError(errorMessage);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [defaultMessage]
  );

  return { isLoading, message, error, run, setLoading, clearError };
}

// ─── Pre-typed context messages ───────────────────────────────────────────
export const LOADING_MESSAGES = {
  default:   'Brewing your experience…'      as LoadingMessage,
  menu:      'Loading menu…'                  as LoadingMessage,
  dashboard: 'Preparing dashboard…'           as LoadingMessage,
  order:     'Processing your order…'         as LoadingMessage,
  login:     'Signing you in…'                as LoadingMessage,
  register:  'Creating your account…'         as LoadingMessage,
  save:      'Saving changes…'                as LoadingMessage,
  orders:    'Fetching latest orders…'        as LoadingMessage,
} satisfies Record<string, LoadingMessage>;
