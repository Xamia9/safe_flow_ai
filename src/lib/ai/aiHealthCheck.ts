import { createServerFn } from "@tanstack/react-start";

type GeminiErrorCode =
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
 * Server-only function: performs a minimal Gemini API connectivity check
 * using a fixed, harmless test prompt. Never accepts arbitrary prompts from clients.
 *
 * Returns only minimal success/error information — no keys, raw errors, or sensitive diagnostics.
 * When an error occurs, the response includes a sanitized code, user-friendly message,
 * and (if available) the HTTP status and provider error code for actionable diagnostics.
 *
 * The Gemini key manager and @google/genai SDK are loaded via dynamic import
 * inside the handler so they never enter the client bundle.
 */

const HEALTH_CHECK_PROMPT = "Reply with exactly: OK";

export type HealthCheckResult = {
  ok: boolean;
  message: string;
  code?: GeminiErrorCode;
  elapsedMs?: number;
  httpStatus?: number;
  providerCode?: string | number;
};

export const aiHealthCheck = createServerFn({ method: "POST" }).handler(
  async (): Promise<HealthCheckResult> => {
    const { getGeminiKeyManager, SafeGeminiError, extractText } =
      await import("@/lib/server/geminiKeyManager.server");
    const manager = getGeminiKeyManager();

    if (!manager.hasKeys()) {
      return {
        ok: false,
        message: "No Gemini API keys are configured. Add at least one key to enable AI features.",
        code: "no_keys",
      };
    }

    const start = Date.now();

    try {
      const response = await manager.generateContent(HEALTH_CHECK_PROMPT, {
        timeoutMs: 10_000,
        maxOutputTokens: 10,
        maxAttempts: 1,
      });

      const text = extractText(response);
      const elapsedMs = Date.now() - start;

      if (text === null) {
        return {
          ok: false,
          message: "The AI service returned an unexpected response. Please try again later.",
          code: "invalid_response",
          elapsedMs,
        };
      }

      return {
        ok: true,
        message: "AI service is reachable and responding.",
        elapsedMs,
      };
    } catch (error) {
      const elapsedMs = Date.now() - start;

      if (error instanceof SafeGeminiError) {
        return {
          ok: false,
          message: error.message,
          code: error.code,
          elapsedMs,
          ...(error.httpStatus !== undefined && { httpStatus: error.httpStatus }),
          ...(error.providerCode !== undefined && { providerCode: error.providerCode }),
        };
      }

      return {
        ok: false,
        message: "An unexpected error occurred while contacting the Gemini API. Please try again later.",
        code: "unknown_error",
        elapsedMs,
      };
    }
  },
);
