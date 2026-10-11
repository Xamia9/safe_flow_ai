import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock @google/genai so tests never make real API calls.
// vi.hoisted ensures the mock fn is available when vi.mock's factory runs.
const { mockGenerateContent } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  return { mockGenerateContent };
});

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = { generateContent: mockGenerateContent };
      constructor(_config: unknown) {}
    },
  };
});

import { getGeminiKeyManager, SafeGeminiError, extractText } from "./geminiKeyManager.server";

const ENV_VARS = [
  "GEMINI_API_KEY",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_API_KEY_4",
  "GEMINI_API_KEY_5",
  "GEMINI_API_KEY_6",
  "GEMINI_API_KEY_7",
  "GEMINI_API_KEY_8",
  "GEMINI_API_KEY_9",
  "GEMINI_API_KEY_10",
  "GEMINI_API_KEY_11",
  "GEMINI_MODEL",
];

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_VARS) {
    originalEnv[key] = process.env[key];
    delete process.env[key];
  }
  mockGenerateContent.mockReset();
  getGeminiKeyManager().reset();
});

afterEach(() => {
  for (const key of ENV_VARS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
  getGeminiKeyManager().reset();
});

function setKeys(...keys: string[]) {
  keys.forEach((key, i) => {
    process.env[`GEMINI_API_KEY${i === 0 ? "" : `_${i + 1}`}`] = key;
  });
}

function mockSuccess(text: string = "OK") {
  mockGenerateContent.mockResolvedValue({ text });
}

function mockError(status: number, message = "API error") {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  mockGenerateContent.mockRejectedValue(error);
}

function mockNetworkError() {
  mockGenerateContent.mockRejectedValue(new Error("fetch failed"));
}

describe("GeminiKeyManager — key loading", () => {
  it("hasKeys returns false when no keys are configured", () => {
    expect(getGeminiKeyManager().hasKeys()).toBe(false);
  });

  it("hasKeys returns true when at least one key is configured", () => {
    setKeys("key-1");
    expect(getGeminiKeyManager().hasKeys()).toBe(true);
  });

  it("loads multiple keys from numbered env vars", () => {
    setKeys("key-1", "key-2", "key-3");
    const info = getGeminiKeyManager().getKeyInfo();
    expect(info).toHaveLength(3);
    expect(info.every((k) => k.isValid)).toBe(true);
  });

  it("discovers all 11 key slots when every env var is set", () => {
    setKeys("k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "k9", "k10", "k11");
    const info = getGeminiKeyManager().getKeyInfo();
    expect(info).toHaveLength(11);
    expect(info[0]!.envVar).toBe("GEMINI_API_KEY");
    expect(info[1]!.envVar).toBe("GEMINI_API_KEY_2");
    expect(info[10]!.envVar).toBe("GEMINI_API_KEY_11");
    expect(info.every((k) => k.isValid)).toBe(true);
  });

  it("ignores empty/whitespace-only values", () => {
    process.env["GEMINI_API_KEY"] = "  ";
    process.env["GEMINI_API_KEY_2"] = "real-key";
    expect(getGeminiKeyManager().hasKeys()).toBe(true);
    expect(getGeminiKeyManager().getKeyInfo()).toHaveLength(1);
  });
});

describe("GeminiKeyManager — missing keys", () => {
  it("throws SafeGeminiError with no_keys code", async () => {
    await expect(getGeminiKeyManager().generateContent("test"))
      .rejects.toMatchObject({ code: "no_keys" });
  });

  it("throws SafeGeminiError instance", async () => {
    try {
      await getGeminiKeyManager().generateContent("test");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(SafeGeminiError);
    }
  });
});

describe("GeminiKeyManager — successful call", () => {
  it("returns the Gemini response on success", async () => {
    setKeys("key-1");
    mockSuccess("Hello");
    const response = await getGeminiKeyManager().generateContent("test");
    expect(response.text).toBe("Hello");
  });

  it("uses default model gemini-2.5-flash when GEMINI_MODEL is not set", async () => {
    setKeys("key-1");
    mockSuccess();
    await getGeminiKeyManager().generateContent("test");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-2.5-flash" }),
    );
  });

  it("uses GEMINI_MODEL env var when set", async () => {
    setKeys("key-1");
    process.env["GEMINI_MODEL"] = "gemini-2.5-flash";
    mockSuccess();
    await getGeminiKeyManager().generateContent("test");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-2.5-flash" }),
    );
  });

  it("respects maxOutputTokens option", async () => {
    setKeys("key-1");
    mockSuccess();
    await getGeminiKeyManager().generateContent("test", { maxOutputTokens: 50 });
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({ config: expect.objectContaining({ maxOutputTokens: 50 }) }),
    );
  });
});

describe("GeminiKeyManager — invalid key fallback", () => {
  it("falls back to second key when first returns 401", async () => {
    setKeys("bad-key", "good-key");
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error("401"), { status: 401 }))
      .mockResolvedValueOnce({ text: "OK from key 2" });

    const response = await getGeminiKeyManager().generateContent("test");
    expect(response.text).toBe("OK from key 2");
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it("falls back when first key returns 403", async () => {
    setKeys("bad-key", "good-key");
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error("403"), { status: 403 }))
      .mockResolvedValueOnce({ text: "OK from key 2" });

    const response = await getGeminiKeyManager().generateContent("test");
    expect(response.text).toBe("OK from key 2");
  });

  it("falls back when first key returns 400", async () => {
    setKeys("bad-key", "good-key");
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error("400"), { status: 400 }))
      .mockResolvedValueOnce({ text: "OK from key 2" });

    const response = await getGeminiKeyManager().generateContent("test");
    expect(response.text).toBe("OK from key 2");
  });

  it("marks invalid key and skips it on subsequent calls", async () => {
    setKeys("bad-key", "good-key");
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error("401"), { status: 401 }))
      .mockResolvedValueOnce({ text: "OK from key 2" })
      .mockResolvedValueOnce({ text: "OK from key 2 again" });

    await getGeminiKeyManager().generateContent("test");
    const response = await getGeminiKeyManager().generateContent("test");
    expect(response.text).toBe("OK from key 2 again");
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it("throws when all keys are invalid", async () => {
    setKeys("bad-1", "bad-2");
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error("401"), { status: 401 }))
      .mockRejectedValueOnce(Object.assign(new Error("401"), { status: 401 }));

    await expect(getGeminiKeyManager().generateContent("test"))
      .rejects.toMatchObject({ code: "service_error" });
  });
});

describe("GeminiKeyManager — quota / rate limit (429)", () => {
  it("does NOT fall back to another key on 429", async () => {
    setKeys("key-1", "key-2");
    mockError(429, "Quota exceeded");

    await expect(getGeminiKeyManager().generateContent("test"))
      .rejects.toMatchObject({ code: "rate_limited" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("returns rate_limited error code on 429", async () => {
    setKeys("key-1");
    mockError(429);
    try {
      await getGeminiKeyManager().generateContent("test");
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(SafeGeminiError);
      expect((e as SafeGeminiError).code).toBe("rate_limited");
    }
  });

  it("does not mark key invalid for 429", async () => {
    setKeys("key-1");
    mockError(429);
    await expect(getGeminiKeyManager().generateContent("test")).rejects.toMatchObject({ code: "rate_limited" });

    const info = getGeminiKeyManager().getKeyInfo();
    expect(info[0]!.isValid).toBe(true);
  });
});

describe("GeminiKeyManager — transient errors", () => {
  it("falls back on 500 server error", async () => {
    setKeys("key-1", "key-2");
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error("500"), { status: 500 }))
      .mockResolvedValueOnce({ text: "OK from key 2" });

    const response = await getGeminiKeyManager().generateContent("test");
    expect(response.text).toBe("OK from key 2");
  });

  it("falls back on 503 service unavailable", async () => {
    setKeys("key-1", "key-2");
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error("503"), { status: 503 }))
      .mockResolvedValueOnce({ text: "OK from key 2" });

    const response = await getGeminiKeyManager().generateContent("test");
    expect(response.text).toBe("OK from key 2");
  });

  it("does not mark key invalid for 500", async () => {
    setKeys("key-1");
    mockError(500);
    await expect(getGeminiKeyManager().generateContent("test")).rejects.toMatchObject({ code: "service_error" });

    const info = getGeminiKeyManager().getKeyInfo();
    expect(info[0]!.isValid).toBe(true);
  });

  it("falls back on network error", async () => {
    setKeys("key-1", "key-2");
    mockGenerateContent
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce({ text: "OK from key 2" });

    const response = await getGeminiKeyManager().generateContent("test");
    expect(response.text).toBe("OK from key 2");
  });

  it("falls back on timeout/abort error", async () => {
    setKeys("key-1", "key-2");
    const abortErr = new Error("aborted") as Error & { name: string };
    abortErr.name = "AbortError";
    mockGenerateContent
      .mockRejectedValueOnce(abortErr)
      .mockResolvedValueOnce({ text: "OK from key 2" });

    const response = await getGeminiKeyManager().generateContent("test", { timeoutMs: 100 });
    expect(response.text).toBe("OK from key 2");
  });

  it("does not mark key invalid for network error", async () => {
    setKeys("key-1");
    mockNetworkError();
    await expect(getGeminiKeyManager().generateContent("test")).rejects.toMatchObject({ code: "service_error" });

    const info = getGeminiKeyManager().getKeyInfo();
    expect(info[0]!.isValid).toBe(true);
  });
});

describe("GeminiKeyManager — bounded retries", () => {
  it("does not retry indefinitely", async () => {
    setKeys("key-1", "key-2");
    mockNetworkError();
    await expect(getGeminiKeyManager().generateContent("test"))
      .rejects.toMatchObject({ code: "service_error" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it("respects maxAttempts option", async () => {
    setKeys("key-1", "key-2", "key-3");
    mockNetworkError();
    await expect(getGeminiKeyManager().generateContent("test", { maxAttempts: 1 }))
      .rejects.toMatchObject({ code: "service_error" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("caps maxAttempts at 11 even with many keys", async () => {
    setKeys("k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "k9", "k10", "k11", "k12", "k13");
    mockNetworkError();
    await expect(getGeminiKeyManager().generateContent("test"))
      .rejects.toMatchObject({ code: "service_error" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(11);
  });
});

describe("GeminiKeyManager — safe error responses", () => {
  it("SafeGeminiError does not contain API key values", async () => {
    setKeys("SECRET-KEY-12345");
    mockError(401);
    try {
      await getGeminiKeyManager().generateContent("test");
      expect.fail("should throw");
    } catch (e) {
      const safe = e as SafeGeminiError;
      expect(safe.message).not.toContain("SECRET-KEY-12345");
      expect(safe.code).toBeDefined();
    }
  });

  it("SafeGeminiError message is user-friendly", async () => {
    setKeys("key-1");
    mockError(500, "Internal server error with sensitive stack trace data");
    try {
      await getGeminiKeyManager().generateContent("test");
      expect.fail("should throw");
    } catch (e) {
      const safe = e as SafeGeminiError;
      expect(safe.message).not.toContain("Internal server error");
      expect(safe.message).not.toContain("stack trace");
    }
  });
});

describe("GeminiKeyManager — all keys on cooldown", () => {
  it("returns all_keys_unavailable when all keys are temporarily invalid", async () => {
    setKeys("bad-1", "bad-2");
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error("401"), { status: 401 }))
      .mockRejectedValueOnce(Object.assign(new Error("401"), { status: 401 }));

    // First call exhausts both keys with 401, marking them invalid
    await expect(getGeminiKeyManager().generateContent("test"))
      .rejects.toMatchObject({ code: "service_error" });

    // Second call: both keys are on cooldown
    mockSuccess("OK");
    await expect(getGeminiKeyManager().generateContent("test"))
      .rejects.toMatchObject({ code: "all_keys_unavailable" });
  });
});

describe("extractText", () => {
  it("extracts text from a valid response", () => {
    expect(extractText({ text: "Hello" } as any)).toBe("Hello");
  });

  it("returns null for empty text", () => {
    expect(extractText({ text: "" } as any)).toBeNull();
  });

  it("returns null when text property is missing", () => {
    expect(extractText({} as any)).toBeNull();
  });

  it("returns null when response is malformed", () => {
    expect(extractText(null as any)).toBeNull();
  });
});
