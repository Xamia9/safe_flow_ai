import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

/**
 * Fixed model identifier — the browser can never override this.
 * Must be verified against Groq's available models before the real call is wired.
 */
const GROQ_MODEL = "openai/gpt-oss-120b" as const;

const MAX_CONTEXT_LENGTH = 8000;

/**
 * Request shape accepted by the AI server function.
 * `feature` controls which system prompt is used server-side.
 * No `model` field — the model is always server-determined.
 */
export const aiRequestSchema = z.object({
  feature: z.enum(["explain_results", "generate_action_plan"]),
  context: z.string().min(1).max(MAX_CONTEXT_LENGTH),
});

export type AiRequest = z.infer<typeof aiRequestSchema>;

/**
 * Result returned by the server function.
 * `implemented: false` signals that the Groq call has not been wired yet —
 * the UI must not present this as an AI-generated answer.
 */
export interface AiResponse {
  text: string;
  implemented: boolean;
  model: string;
}

/**
 * Pure validation helper — testable without a running server.
 * Returns the parsed input or throws a Zod error.
 */
export function validateAiRequest(input: unknown): AiRequest {
  return aiRequestSchema.parse(input);
}

/**
 * Server-only AI function. The browser calls this via TanStack Start RPC;
 * the function body runs exclusively on the Nitro server.
 *
 * No network request or API key is used yet. The handler returns a
 * placeholder so the wiring can be tested end-to-end before the real
 * Groq fetch is added.
 */
export const explainWithGroq = createServerFn({ method: "POST" })
  .validator(aiRequestSchema)
  .handler(async ({ data }): Promise<AiResponse> => {
    return {
      text: "AI explanation is not yet available. This is a placeholder — not an AI-generated answer.",
      implemented: false,
      model: GROQ_MODEL,
    };
  });
