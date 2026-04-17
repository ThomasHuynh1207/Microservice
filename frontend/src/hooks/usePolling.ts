import { useEffect, useRef } from 'react';

const DEFAULT_POLLING_INTERVAL = 240000;

export const usePolling = (
  callback: () => Promise<void>,
  intervalMs: number = DEFAULT_POLLING_INTERVAL,
  enabled: boolean = true
): void => {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<number | null>(null);

  callbackRef.current = callback;

  const clearPolling = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const runCallback = async () => {
    try {
      await callbackRef.current();
    } catch (error) {
      console.error('[usePolling] callback failed:', error);
    }
  };

  const startPolling = () => {
    clearPolling();

    if (!enabled || typeof document === 'undefined' || document.visibilityState !== 'visible') {
      return;
    }

    void runCallback();
    intervalRef.current = window.setInterval(() => {
      void runCallback();
    }, intervalMs);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (!enabled) {
        clearPolling();
        return;
      }

      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        clearPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearPolling();
    };
  }, [enabled, intervalMs]);
};
