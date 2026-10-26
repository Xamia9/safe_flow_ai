import { useCallback, useState } from "react";
import { explainWithGroq } from "@/lib/ai/groq";
import type { Language } from "@/i18n/translations";

type Status = "idle" | "loading" | "success" | "error";

interface AiState {
  status: Status;
  text: string | null;
  error: string | null;
}

const INITIAL: AiState = { status: "idle", text: null, error: null };

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("<!doctype") || msg.includes("<!DOCTYPE") || msg.includes("Something went wrong")) {
      return "The server encountered an error while processing your request. Please try again.";
    }
    return msg;
  }
  return "Something went wrong. Please try again.";
}

export function useAiExplain() {
  const [state, setState] = useState<AiState>(INITIAL);

  const call = useCallback(async (feature: "explain_results" | "generate_action_plan", context: string, language: Language = "en") => {
    setState({ status: "loading", text: null, error: null });
    try {
      const res = await explainWithGroq({ data: { feature, context, language } });
      if (res && typeof res.text === "string" && res.text.trim().length > 0) {
        setState({ status: "success", text: res.text, error: null });
      } else {
        setState({ status: "error", text: null, error: "The AI service returned an empty response. Please try again." });
      }
    } catch (err) {
      setState({ status: "error", text: null, error: friendlyErrorMessage(err) });
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, call, reset };
}
