import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TEST_PROMPT = "Reply with one short friendly sentence confirming you are online.";

/** Connection test: sends a fixed harmless prompt. No user data is sent. */
export const testGeminiConnection = createServerFn({ method: "POST" }).handler(async () => {
  const { generateGeminiText } = await import("./gemini.server");
  return generateGeminiText(TEST_PROMPT);
});

const promptSchema = z.object({ prompt: z.string().trim().min(1).max(2000) });

/** Minimal generic endpoint for future use; validated, length-capped input. */
export const generateText = createServerFn({ method: "POST" })
  .inputValidator((data) => promptSchema.parse(data))
  .handler(async ({ data }) => {
    const { generateGeminiText } = await import("./gemini.server");
    return generateGeminiText(data.prompt);
  });
