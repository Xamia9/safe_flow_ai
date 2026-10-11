import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Wifi } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AiLoadingState } from "@/components/common/AiLoadingState";
import { Button } from "@/components/ui/button";
import { useAiTimer } from "@/hooks/use-ai-timer";
import { aiHealthCheck, type HealthCheckResult } from "@/lib/ai/aiHealthCheck";

export const Route = createFileRoute("/ai-status")({
  head: () => ({
    meta: [
      { title: "AI Status — SafeFlow AI" },
      { name: "description", content: "Check the connectivity status of the AI service." },
    ],
  }),
  component: AiStatusPage,
});

function AiStatusPage() {
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const timer = useAiTimer();

  const runCheck = async () => {
    if (timer.status === "loading") return;
    timer.start();
    try {
      const res = await aiHealthCheck();
      setResult(res);
      if (res.ok) {
        timer.succeed();
      } else {
        timer.fail();
      }
    } catch {
      setResult({
        ok: false,
        message: "An unexpected error occurred while contacting the AI service.",
        code: "unknown_error",
      });
      timer.fail();
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="System"
        title="AI service status"
        description="Verify that the AI service is reachable and responding. This performs a real connection check using a harmless test prompt."
      />

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-soft text-teal">
            <Wifi className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Connection check</h2>
            <p className="text-sm text-muted-foreground">
              Sends a minimal request to the Gemini API and reports the result.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Button
            type="button"
            onClick={runCheck}
            disabled={timer.status === "loading"}
          >
            <Sparkles /> Run connectivity check
          </Button>
        </div>

        <div className="mt-4">
          <AiLoadingState
            status={timer.status}
            formattedTime={timer.formatted}
            loadingMessage="Checking AI service…"
            successMessage={result?.ok ? "AI service is reachable." : "Check complete."}
            errorMessage={result?.message ?? "We couldn't reach the AI service."}
            onRetry={runCheck}
          />
        </div>

        {result && (timer.status === "done" || timer.status === "error") && (
          <div className="mt-4 rounded-lg border bg-background p-4 text-sm">
            <p className="font-medium">
              Status: {result.ok ? "Connected" : "Unavailable"}
            </p>
            <p className="mt-1 text-muted-foreground">{result.message}</p>
            <div className="mt-2 space-y-1 font-mono text-xs text-muted-foreground tabular">
              {result.code && (
                <p>Error code: {result.code}</p>
              )}
              {result.httpStatus !== undefined && (
                <p>HTTP status: {result.httpStatus}</p>
              )}
              {result.providerCode !== undefined && (
                <p>Provider code: {String(result.providerCode)}</p>
              )}
              {result.elapsedMs !== undefined && (
                <p>Response time: {result.elapsedMs}ms</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
