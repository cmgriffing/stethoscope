/**
 * Bounded re-scoring for late-hydrating GitHub content.
 *
 * The repo page is scored once per message, but GitHub hydrates some signals
 * (commit `datetime` attributes, contributor counts) after first paint. Rather
 * than running MutationObservers through every check, a small number of
 * delayed re-scores are scheduled while those signals are missing. Each
 * re-score re-sends `ScoreCalculated`; the background script replaces the
 * previous result for the tab id.
 */

export interface RetryScheduler {
  /** Number of retries scheduled since the last reset. */
  readonly retries: number;
  /**
   * Schedules `retry` once. Returns true when a retry is pending or was
   * scheduled, false when the retry budget is exhausted.
   */
  schedule(retry: () => void): boolean;
  /** Clears a pending retry and restores the retry budget. */
  reset(): void;
}

export interface RetrySchedulerOptions {
  /** Maximum retries per reset cycle. Default 3. */
  maxRetries?: number;
  /** Delay before a retry runs. Default 1500ms. */
  delayMs?: number;
  setTimer?: (callback: () => void, delayMs: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export function createRetryScheduler(
  options: RetrySchedulerOptions = {}
): RetryScheduler {
  const maxRetries = options.maxRetries ?? 3;
  const delayMs = options.delayMs ?? 1500;
  const setTimer =
    options.setTimer ??
    ((callback: () => void, timeout: number) =>
      setTimeout(callback, timeout) as unknown);
  const clearTimer =
    options.clearTimer ??
    ((handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>));

  let retries = 0;
  let pendingTimer: unknown = null;

  return {
    get retries() {
      return retries;
    },
    schedule(retry) {
      if (pendingTimer !== null) {
        return true;
      }
      if (retries >= maxRetries) {
        return false;
      }
      retries += 1;
      pendingTimer = setTimer(() => {
        pendingTimer = null;
        retry();
      }, delayMs);
      return true;
    },
    reset() {
      if (pendingTimer !== null) {
        clearTimer(pendingTimer);
        pendingTimer = null;
      }
      retries = 0;
    },
  };
}
