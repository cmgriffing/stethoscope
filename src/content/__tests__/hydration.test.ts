import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRetryScheduler } from "../hydration";

describe("createRetryScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs a scheduled retry after the delay", () => {
    const scheduler = createRetryScheduler({ maxRetries: 3, delayMs: 1500 });
    const retry = vi.fn();

    expect(scheduler.schedule(retry)).toBe(true);
    expect(retry).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("bounds the number of retries", () => {
    const scheduler = createRetryScheduler({ maxRetries: 3, delayMs: 1500 });
    const retry = vi.fn();

    for (let i = 0; i < 3; i += 1) {
      expect(scheduler.schedule(retry)).toBe(true);
      vi.advanceTimersByTime(1500);
    }

    expect(retry).toHaveBeenCalledTimes(3);
    expect(scheduler.schedule(retry)).toBe(false);

    vi.advanceTimersByTime(1500);
    expect(retry).toHaveBeenCalledTimes(3);
  });

  it("does not double-schedule while a retry is pending", () => {
    const scheduler = createRetryScheduler({ maxRetries: 3, delayMs: 1500 });
    const retry = vi.fn();

    expect(scheduler.schedule(retry)).toBe(true);
    expect(scheduler.schedule(retry)).toBe(true);

    vi.advanceTimersByTime(1500);

    expect(retry).toHaveBeenCalledTimes(1);
    expect(scheduler.retries).toBe(1);
  });

  it("resets the budget and clears a pending timer", () => {
    const scheduler = createRetryScheduler({ maxRetries: 1, delayMs: 1500 });
    const retry = vi.fn();

    scheduler.schedule(retry);
    expect(scheduler.retries).toBe(1);

    scheduler.reset();
    expect(scheduler.retries).toBe(0);

    // The pending timer was cleared, so the first callback never runs.
    vi.advanceTimersByTime(1500);
    expect(retry).not.toHaveBeenCalled();

    // The budget is restored for a fresh cycle.
    expect(scheduler.schedule(retry)).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(retry).toHaveBeenCalledTimes(1);
    expect(scheduler.schedule(retry)).toBe(false);
  });
});
