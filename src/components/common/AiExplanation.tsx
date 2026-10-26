import { Sparkles, Loader2, AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiMarkdown } from "./AiMarkdown";
import { useT } from "@/i18n/LanguageContext";

interface AiExplanationProps {
  status: "idle" | "loading" | "success" | "error";
  text: string | null;
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
  sectionId: string;
  sectionTitle: string;
}

export function AiExplanation({ status, text, error, onRetry, onDismiss, sectionId, sectionTitle }: AiExplanationProps) {
  const t = useT();
  if (status === "idle") return null;

  return (
    <section
      id={sectionId}
      className="rounded-xl border border-teal/20 bg-teal-soft/30 p-6"
      aria-labelledby={`${sectionId}-h`}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal" aria-hidden />
          <h2 id={`${sectionId}-h`} className="text-lg font-semibold">{sectionTitle}</h2>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={t("ai.dismiss")} onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {status === "loading" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>{t("ai.generating")}</span>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-negative">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error ?? t("ai.errorDefault")}</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" /> {t("ai.tryAgain")}
          </Button>
        </div>
      )}

      {status === "success" && (
        <div className="mt-4 space-y-3">
          {text && text.trim() ? (
            <AiMarkdown text={text} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("ai.aiEmpty")}</p>
          )}
          <p className="text-xs text-muted-foreground">{t("ai.footer")}</p>
        </div>
      )}
    </section>
  );
}
