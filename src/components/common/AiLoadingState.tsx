import { Loader2, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiRequestStatus } from "@/hooks/use-ai-timer";

/**
 * Reusable AI loading state component.
 *
 * Shows an elapsed-time counter (MM:SS) while an AI request is pending,
 * a success state when it completes, or a friendly error with a Retry
 * button when it fails.
 *
 * The counter updates visibly once per second, starts when `status` becomes
 * "loading", and stops when it becomes "done" or "error".
 *
 * Designed to be reused across future AI explanation features.
 */

export function AiLoadingState({
  status,
  formattedTime,
  loadingMessage = "Generating your explanation\u2026",
  successMessage = "Response received.",
  errorMessage = "We couldn't reach the AI service. Please try again.",
  onRetry,
  className,
}: {
  status: AiRequestStatus;
  formattedTime: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}) {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between",
        status === "error" && "border-warning/40",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {status === "loading" && (
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-teal" aria-hidden />
          <div>
            <p className="text-sm font-medium">{loadingMessage}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular">
              Elapsed {formattedTime}
            </p>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {status === "error" && (
        <>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" aria-hidden />
            <div>
              <p className="text-sm font-medium">{errorMessage}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular">
                Waited {formattedTime}
              </p>
            </div>
          </div>
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="shrink-0"
            >
              <RotateCcw /> Retry
            </Button>
          )}
        </>
      )}
    </div>
  );
}
