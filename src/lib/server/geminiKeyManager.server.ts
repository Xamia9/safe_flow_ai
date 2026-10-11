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

/**
 * Safe server-side diagnostic logging.
 * Records the error category, HTTP status, and provider code — never credentials.
 */
function logDiagnostic(
  category: string,
  details: { httpStatus?: number; providerCode?: string | number; keyIndex?: number },
): void {
  const parts = [`[Gemini] ${category}`];
  if (details.httpStatus !== undefined) parts.push(`HTTP ${details.httpStatus}`);
  if (details.providerCode !== undefined) parts.push(`providerCode=${details.providerCode}`);
  if (details.keyIndex !== undefined) parts.push(`keyIndex=${details.keyIndex}`);
  console.error(parts.join(" | "));
}

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
   * Classify an error into an actionable category for safe reporting.
   *
   * - 400, 401, 403 → invalid_key (invalid/revoked key → eligible for fallback)
   * - 404 → model_unavailable (model name not found → NOT eligible, same model for all keys)
   * - 429 → rate_limited (quota/rate limit → NOT eligible, respect Google's terms)
   * - 500, 503 → server_error (transient → eligible for fallback)
   * - AbortError / network → timeout (eligible for fallback)
   * - Unknown → unknown (eligible for fallback)
   *
   * Returns the category, whether key fallback is eligible, and whether
   * the current key should be marked invalid.
   */
  private classifyError(error: unknown): {
    category: GeminiErrorCode;
    eligible: boolean;
    shouldMarkInvalid: boolean;
  } {
    const status = extractStatus(error);
    const providerCode = extractProviderCode(error);
    const isAbort = isAbortError(error);

    if (status === 400 || status === 401 || status === 403) {
      return { category: "invalid_key", eligible: true, shouldMarkInvalid: true };
    }
    if (status === 404) {
      return { category: "model_unavailable", eligible: false, shouldMarkInvalid: false };
    }
    if (status === 429) {
      return { category: "rate_limited", eligible: false, shouldMarkInvalid: false };
    }
    if (status === 500 || status === 503) {
      return { category: "server_error", eligible: true, shouldMarkInvalid: false };
    }
    if (isAbort) {
      return { category: "timeout", eligible: true, shouldMarkInvalid: false };
    }
    // Network errors or unknown errors
    return { category: "unknown_error", eligible: true, shouldMarkInvalid: false };
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

    let lastCategory: GeminiErrorCode = "unknown_error";
    let lastHttpStatus: number | undefined;
    let lastProviderCode: string | number | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const keyState = this.selectKey();
      if (!keyState) {
        logDiagnostic("all_keys_unavailable", {});
        throw new SafeGeminiError(
          "all_keys_unavailable",
          "All configured API keys are temporarily unavailable. Please try again later.",
        );
      }

      try {
        const response = await this.callGemini(keyState.apiKey, model, prompt, timeoutMs, options?.maxOutputTokens);
        return response;
      } catch (error) {
        const { category, eligible, shouldMarkInvalid } = this.classifyError(error);
        const httpStatus = extractStatus(error) || undefined;
        const providerCode = extractProviderCode(error) || undefined;

        lastCategory = category;
        lastHttpStatus = httpStatus;
        lastProviderCode = providerCode;

        logDiagnostic(category, {
          ...(httpStatus !== undefined && { httpStatus }),
          ...(providerCode !== undefined && { providerCode }),
          keyIndex: attempt,
        });

        if (shouldMarkInvalid) {
          this.markInvalid(keyState);
        }

        if (!eligible) {
          // Quota/rate-limit or model unavailable — don't try other keys
          throw new SafeGeminiError(
            category,
            friendlyMessage(category),
            ...(httpStatus !== undefined ? [httpStatus] : []),
            ...(providerCode !== undefined ? [providerCode] : []),
          );
        }
        // Continue to next attempt (next key)
      }
    }

    // All attempts exhausted
    throw new SafeGeminiError(
      lastCategory,
      friendlyMessage(lastCategory),
      ...(lastHttpStatus !== undefined ? [lastHttpStatus] : []),
      ...(lastProviderCode !== undefined ? [lastProviderCode] : []),
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
 * diagnostics to clients. Only a safe category, user-friendly message, and
 * optional HTTP status / provider error code are included.
 */
export class SafeGeminiError extends Error {
  readonly code: GeminiErrorCode;
  readonly httpStatus?: number;
  readonly providerCode?: string | number;

  constructor(
    code: GeminiErrorCode,
    message: string,
    httpStatus?: number,
    providerCode?: string | number,
  ) {
    super(message);
    this.name = "SafeGeminiError";
    this.code = code;
    if (httpStatus !== undefined) this.httpStatus = httpStatus;
    if (providerCode !== undefined) this.providerCode = providerCode;
  }
}

export type GeminiErrorCode =
  | "no_keys"
  | "all_keys_unavailable"
  | "invalid_key"
  | "model_unavailable"
  | "rate_limited"
  | "server_error"
  | "timeout"
  | "unknown_error"
  | "invalid_response";

/**
 * User-friendly message for each error category.
 * Never includes raw provider error text or credentials.
 */
function friendlyMessage(code: GeminiErrorCode): string {
  switch (code) {
    case "invalid_key":
      return "The configured API key is invalid or revoked. Please check your Gemini API key configuration.";
    case "model_unavailable":
      return "The requested Gemini model is not available. Check the GEMINI_MODEL setting or use a different model.";
    case "rate_limited":
      return "The AI service is currently rate-limited. Please try again in a few moments.";
    case "server_error":
      return "The Gemini service returned a server error. Please try again later.";
    case "timeout":
      return "The request to the Gemini API timed out. Please try again.";
    case "all_keys_unavailable":
      return "All configured API keys are temporarily unavailable. Please try again later.";
    case "unknown_error":
      return "An unexpected error occurred while contacting the Gemini API. Please try again later.";
    default:
      return "The AI service could not be reached. Please try again later.";
  }
}

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
    if (error2 && typeof error2["object"]) {
      if (typeof error2["status"] === "number") return error2["status"];
      if (typeof error2["statusCode"] === "number") return error2["statusCode"];
      if (typeof error2["code"] === "number") return error2["code"];
    }
  }
  return 0;
}

/**
 * Extract a provider-specific error code from Google API error shapes.
 * Google APIs typically return: { error: { code: 400, status: "INVALID_ARGUMENT", message: "..." } }
 * Returns undefined if no provider code could be determined.
 */
function extractProviderCode(error: unknown): string | number | undefined {
  if (error == null || typeof error !== "object") return undefined;
  const e = error as Record<string, unknown>;

  // Check for Google API error envelope: { error: { status: "..." } }
  const nested = e["error"] as Record<string, unknown> | undefined;
  if (nested && typeof nested === "object") {
    if (typeof nested["status"] === "string") return nested["status"];
    if (typeof nested["code"] === "number") return nested["code"];
  }

  // Some errors put status directly on the error object
  if (typeof e["status"] === "string") return e["status"];
  if (typeof e["code"] === "string") return e["code"];

  return undefined;
}

/**
 * Check whether an error is an AbortError (from AbortController timeout).
 */
function isAbortError(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const e = error as Record<string, unknown>;
  if (e["name"] === "AbortError") return true;
  if (typeof e["message"] === "string" && e["message"].includes("aborted")) return true;
  return false;
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
