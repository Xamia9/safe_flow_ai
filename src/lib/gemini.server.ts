// Server-only Gemini helper. The *.server.ts suffix keeps it out of client bundles.
import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.7-flash";
const TIMEOUT_MS = 15_000;

export type GeminiResult = { status: "success"; text: string } | { status: "error"; message: string };

export async function generateGeminiText(prompt: string): Promise<GeminiResult> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) return { status: "error", message: "Gemini is not configured on the server." };

  const ai = new GoogleGenAI({ apiKey });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { abortSignal: controller.signal, maxOutputTokens: 256 },
    });
    const text = res.text?.trim();
    if (!text) return { status: "error", message: "The model returned an empty response." };
    return { status: "success", text };
  } catch (err) {
    const aborted = controller.signal.aborted;
    // Log only the error type/status, never the key or request config.
    const status = (err as { status?: unknown })?.status;
    console.warn(`[gemini] request failed${aborted ? " (timeout)" : ""}${typeof status === "number" ? ` status ${status}` : ""}`);
    return {
      status: "error",
      message: aborted ? "The AI request timed out." : "The AI service could not be reached.",
    };
  } finally {
    clearTimeout(timer);
  }
}
