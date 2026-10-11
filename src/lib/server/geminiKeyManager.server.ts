import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";

/**
 * Server-side Gemini API key manager.
 *
 * Collects every configured key (GEMINI_API_KEY, GEMINI_API_KEY_2, …),
 * tries them in order, and tracks runtime validity so we don't repeatedly
 * hit a key that returned a 400/401/403 (invalid/revoked).
 *
 * Quota / rate-limit responses (429) are NOT eligible for fallback —
 * we respect Google's quota guidance instead of cycling accounts to bypass it.
 * Transient network errors do NOT permanently mark a key invalid.
 */

const KEY_ENV_VARS = [
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
];

/** How long to skip a key that returned an auth/permission error. */
const INVALID_KEY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

type KeyState = {
  apiKey: string;
  /** Timestamp (ms) until which this key is considered temporarily invalid. 0 = usable. */
  invalidUntil: number;
};

type KeyInfo = {
  envVar: string;
  isValid: boolean;
};

class GeminiKeyManager {
  private keys: KeyState[] = [];
  private nextIndex = 0;
  private initialized = false;

  /**
   * Load keys from the environment. Called lazily on first use so that
   * tests can set environment variables before the manager reads them.
   */
  private init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.keys = [];
    for (const envVar of KEY_ENV_VARS) {
      const val = process.env[envVar];
      if (val && val.trim().length > 0) {
        this.keys.push({ apiKey: val.trim(), invalidUntil: 0 });
      }
    }
  }

  /** Reset state — used by tests. */
  reset(): void {
    this.keys = [];
    this.nextIndex = 0;
    this.initialized = false;
  }

  /** Force (re)load keys from the current environment. */
  reload(): void {
    this.reset();
    this.init();
  }

  /** Returns true if at least one key is configured. */
  hasKeys(): boolean {
    this.init();
    return this.keys.length > 0;
  }

  /** Returns metadata about configured keys without exposing their values. */
  getKeyInfo(): KeyInfo[] {
    this.init();
    const now = Date.now();
    return this.keys.map((k, i) => ({
      envVar: KEY_ENV_VARS[i] ?? `key_${i}`,
      isValid: k.invalidUntil <= now,
    }));
  }

  /**
   * Select the next usable key in round-robin order.
   * Returns null if no key is currently usable.
   */
  private selectKey(): KeyState | null {
    this.init();
    const now = Date.now();
    const n = this.keys.length;
    if (n === 0) return null;

    for (let i = 0; i < n; i++) {
      const idx = (this.nextIndex + i) % n;
      const key = this.keys[idx]!;
      if (key.invalidUntil <= now) {
        this.nextIndex = (idx + 1) % n;
        return key;
      }
    }
    return null;
  }

  /**
   * Mark a key as temporarily invalid (auth/permission error).
   * The key is skipped for INVALID_KEY_COOLDOWN_MS but not permanently.
   */
  private markInvalid(key: KeyState): void {
    key.invalidUntil = Date.now() + INVALID_KEY_COOLDOWN_MS;
  }

  /**
   * Determine whether an error is eligible for key fallback.
   *
   * - 400, 401, 403 → invalid/revoked key → eligible for fallback
   * - 429 → quota/rate limit → NOT eligible (respect Google's terms)
   * - 500, 503 → transient server error → eligible for fallback (retry with same or different key)
   * - Network/timeout errors → eligible for fallback
   *
   * Returns { eligible, shouldMarkInvalid }.
   */
  private classifyError(error: unknown): { eligible: boolean; shouldMarkInvalid: boolean } {
    const status = extractStatus(error);

    if (status === 400 || status === 401 || status === 403) {
      return { eligible: true, shouldMarkInvalid: true };
    }
    if (status === 429) {
      // Quota / rate limit — do NOT rotate keys to bypass
      return { eligible: false, shouldMarkInvalid: false };
    }
    if (status === 500 || status === 503) {
      return { eligible: true, shouldMarkInvalid: false };
    }
    // Network errors, timeouts, unknown errors — eligible, don't mark invalid
    return { eligible: true, shouldMarkInvalid: false };
  }

  /**
   * Execute a Gemini request with automatic key selection and bounded fallback.
   *
   * - Tries the primary key first.
   * - On eligible failures, tries the next configured key.
   * - Maximum `maxAttempts` attempts (default = number of configured keys, min 1, max 11).
   * - Applies a per-attempt timeout via AbortController.
   *
   * Returns the GenerateContentResponse, or throws a sanitized SafeGeminiError.
   */
  async generateContent(
    prompt: string,
    options?: {
      model?: string;
      timeoutMs?: number;
      maxAttempts?: number;
      maxOutputTokens?: number;
    },
  ): Promise<GenerateContentResponse> {
    this.init();
    if (this.keys.length === 0) {
      throw new SafeGeminiError("no_keys", "No Gemini API keys are configured.");
    }

    const model = options?.model ?? process.env["GEMINI_MODEL"] ?? "gemini-2.5-flash";
    const timeoutMs = options?.timeoutMs ?? 15_000;
    const maxAttempts = Math.min(
      options?.maxAttempts ?? this.keys.length,
      this.keys.length,
      11,
    );

    let lastError: unknown = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const keyState = this.selectKey();
      if (!keyState) {
        // All keys are on cooldown
        throw new SafeGeminiError(
          "all_keys_unavailable",
          "All configured API keys are temporarily unavailable. Please try again later.",
        );
      }

      try {
        const response = await this.callGemini(keyState.apiKey, model, prompt, timeoutMs, options?.maxOutputTokens);
        return response;
      } catch (error) {
        lastError = error;
        const { eligible, shouldMarkInvalid } = this.classifyError(error);

        if (shouldMarkInvalid) {
          this.markInvalid(keyState);
        }

        if (!eligible) {
          // Quota/rate-limit — don't try other keys
          throw new SafeGeminiError(
            "rate_limited",
            "The AI service is currently rate-limited. Please try again in a few moments.",
          );
        }
        // Continue to next attempt (next key)
      }
    }

    // All attempts exhausted
    throw new SafeGeminiError(
      "service_error",
      "The AI service could not be reached after multiple attempts. Please try again later.",
    );
  }

  /**
   * Low-level call to the Gemini API with timeout.
   */
  private async callGemini(
    apiKey: string,
    model: string,
    prompt: string,
    timeoutMs: number,
    maxOutputTokens?: number,
  ): Promise<GenerateContentResponse> {
    const client = new GoogleGenAI({ apiKey });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          maxOutputTokens: maxOutputTokens ?? 256,
          abortSignal: controller.signal,
        },
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Singleton instance — server-side only. */
let _instance: GeminiKeyManager | null = null;

export function getGeminiKeyManager(): GeminiKeyManager {
  if (!_instance) {
    _instance = new GeminiKeyManager();
  }
  return _instance;
}

/**
 * Error class that never exposes API keys, raw provider errors, or sensitive
 * diagnostics to clients. Only a safe type and user-friendly message are included.
 */
export class SafeGeminiError extends Error {
  readonly code: GeminiErrorCode;

  constructor(code: GeminiErrorCode, message: string) {
    super(message);
    this.name = "SafeGeminiError";
    this.code = code;
  }
}

export type GeminiErrorCode =
  | "no_keys"
  | "all_keys_unavailable"
  | "rate_limited"
  | "service_error"
  | "invalid_response";

/**
 * Extract HTTP status code from various error shapes.
 * Returns 0 if no status could be determined.
 */
function extractStatus(error: unknown): number {
  if (error == null) return 0;
  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (typeof e["status"] === "number") return e["status"];
    if (typeof e["statusCode"] === "number") return e["statusCode"];
    if (typeof e["code"] === "number") return e["code"];
    // @google/genAI errors may nest status
    const error2 = e["error"] as Record<string, unknown> | undefined;
    if (error2 && typeof error2 === "object") {
      if (typeof error2["status"] === "number") return error2["status"];
      if (typeof error2["code"] === "number") return error2["code"];
    }
  }
  return 0;
}

/**
 * Extract text from a Gemini response in a safe, defensive way.
 * Returns null if the response shape is unexpected.
 */
export function extractText(response: GenerateContentResponse): string | null {
  try {
    const text = response.text;
    if (typeof text === "string" && text.length > 0) return text;
    return null;
  } catch {
    return null;
  }
}
