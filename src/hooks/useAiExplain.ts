import { useCallback, useState } from "react";
import { explainWithGroq, type AiResponse } from "@/lib/ai/groq";

type Status = "idle" | "loading" | "success" | "error";

interface AiState {
  status: Status;
  text: string | null;
  error: string | null;
}

const INITIAL: AiState = { status: "idle", text: null, error: null };

export function useAiExplain() {
  const [state, setState] = useState<AiState>(INITIAL);

  const call = useCallback(async (feature: "explain_results" | "generate_action_plan", context: string) => {
    setState({ status: "loading", text: null, error: null });
    try {
      const res: AiResponse = await explainWithGroq({ data: { feature, context } });
      setState({ status: "success", text: res.text, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setState({ status: "error", text: null, error: msg });
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, call, reset };
}
