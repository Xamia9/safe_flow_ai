import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const steps: { to: string; label: TranslationKey }[] = [
  { to: "/simulate/input", label: "stepper.profile" },
  { to: "/simulate/dashboard", label: "stepper.dashboard" },
  { to: "/simulate/action-plan", label: "stepper.actionPlan" },
] as const;

export function SimulateStepper() {
  const t = useT();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = steps.findIndex((s) => path.startsWith(s.to));
  return (
    <nav aria-label={t("stepper.ariaLabel")} className="border-b bg-card">
      <ol className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
        {steps.map((s, i) => (
          <li key={s.to} className="flex shrink-0 items-center gap-2">
            <Link
              to={s.to}
              aria-current={i === current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                i === current ? "bg-navy text-navy-foreground" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-xs",
                  i === current ? "bg-teal text-navy-foreground" : "bg-secondary",
                )}
              >
                {i + 1}
              </span>
              {t(s.label)}
            </Link>
            {i < steps.length - 1 && <span aria-hidden className="h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
