import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A reusable hook for tracking elapsed time during AI requests.
 *
 * - Starts the timer when `start()` is called (typically when a request begins).
 * - Updates `elapsedSeconds` visibly once per second.
 * - Stops when `stop()` is called (on success or failure).
 * - Cleans up the interval on unmount.
 *
 * Returns elapsed time as a formatted MM:SS string and a raw seconds count,
 * plus the current status: "idle" | "loading" | "done" | "error".
 */

export type AiRequestStatus = "idle" | "loading" | "done" | "error";

export function useAiTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<AiRequestStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setElapsedSeconds(0);
    setStatus("loading");
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const succeed = useCallback(() => {
    clearTimer();
    setStatus("done");
  }, [clearTimer]);

  const fail = useCallback(() => {
    clearTimer();
    setStatus("error");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setElapsedSeconds(0);
    setStatus("idle");
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const formatted = formatElapsedTime(elapsedSeconds);

  return { elapsedSeconds, formatted, status, start, stop, succeed, fail, reset };
}

/** Format seconds as MM:SS (e.g. 0 → "00:00", 65 → "01:05"). */
export function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
