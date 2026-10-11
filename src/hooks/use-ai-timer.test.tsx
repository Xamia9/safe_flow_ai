import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, render, screen, fireEvent } from "@testing-library/react";
import { useAiTimer, formatElapsedTime } from "./use-ai-timer";
import { AiLoadingState } from "@/components/common/AiLoadingState";

// ─── useAiTimer hook tests ─────────────────────────────────────────────

describe("useAiTimer — start and elapsed updates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle status with 00:00", () => {
    const { result } = renderHook(() => useAiTimer());
    expect(result.current.status).toBe("idle");
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.formatted).toBe("00:00");
  });

  it("starts the timer and updates elapsed seconds each second", () => {
    const { result } = renderHook(() => useAiTimer());

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe("loading");
    expect(result.current.elapsedSeconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.elapsedSeconds).toBe(1);
    expect(result.current.formatted).toBe("00:01");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.elapsedSeconds).toBe(3);
    expect(result.current.formatted).toBe("00:03");
  });

  it("stops on success", () => {
    const { result } = renderHook(() => useAiTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.elapsedSeconds).toBe(3);

    act(() => {
      result.current.succeed();
    });
    expect(result.current.status).toBe("done");

    // Timer should not advance further
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.elapsedSeconds).toBe(3);
  });

  it("stops on error", () => {
    const { result } = renderHook(() => useAiTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.fail();
    });
    expect(result.current.status).toBe("error");

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.elapsedSeconds).toBe(2);
  });

  it("cleans up the interval on unmount", () => {
    const { result, unmount } = renderHook(() => useAiTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.elapsedSeconds).toBe(1);

    unmount();

    // After unmount, advancing timers should not cause errors or state updates
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // No error thrown — timer was cleaned up
  });

  it("reset returns to idle state and clears timer", () => {
    const { result } = renderHook(() => useAiTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.elapsedSeconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.elapsedSeconds).toBe(0);
  });

  it("formats elapsed time as MM:SS", () => {
    expect(formatElapsedTime(0)).toBe("00:00");
    expect(formatElapsedTime(5)).toBe("00:05");
    expect(formatElapsedTime(60)).toBe("01:00");
    expect(formatElapsedTime(65)).toBe("01:05");
    expect(formatElapsedTime(125)).toBe("02:05");
  });

  it("restarts correctly when start is called again after a previous run", () => {
    const { result } = renderHook(() => useAiTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      result.current.succeed();
    });

    // Start again
    act(() => {
      result.current.start();
    });
    expect(result.current.status).toBe("loading");
    expect(result.current.elapsedSeconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.elapsedSeconds).toBe(2);
  });
});

// ─── AiLoadingState component tests ────────────────────────────────────

describe("AiLoadingState — rendering", () => {
  it("renders nothing when status is idle", () => {
    const { container } = render(
      <AiLoadingState status="idle" formattedTime="00:00" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading message and elapsed time when loading", () => {
    render(
      <AiLoadingState
        status="loading"
        formattedTime="00:03"
        loadingMessage="Generating your explanation…"
      />,
    );
    expect(screen.getByText("Generating your explanation…")).toBeTruthy();
    expect(screen.getByText(/Elapsed 00:03/)).toBeTruthy();
  });

  it("shows success message when done", () => {
    render(
      <AiLoadingState
        status="done"
        formattedTime="00:05"
        successMessage="Response received."
      />,
    );
    expect(screen.getByText("Response received.")).toBeTruthy();
  });

  it("shows error message and Retry button on error", () => {
    const onRetry = vi.fn();
    render(
      <AiLoadingState
        status="error"
        formattedTime="00:04"
        errorMessage="We couldn't reach the AI service."
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("We couldn't reach the AI service.")).toBeTruthy();
    expect(screen.getByText(/Waited 00:04/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
  });

  it("calls onRetry when Retry button is clicked", () => {
    const onRetry = vi.fn();
    render(
      <AiLoadingState
        status="error"
        formattedTime="00:02"
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders Retry button only when onRetry is provided", () => {
    render(
      <AiLoadingState status="error" formattedTime="00:01" />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
