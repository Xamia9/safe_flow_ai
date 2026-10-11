import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const steps = [
  { to: "/simulate/input", label: "Profile & Scenario" },
  { to: "/simulate/dashboard", label: "Risk Dashboard" },
  { to: "/simulate/action-plan", label: "Action Plan" },
] as const;

export function SimulateStepper() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = steps.findIndex((s) => path.startsWith(s.to));
  return (
    <nav aria-label="Simulation steps" className="border-b bg-card">
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
              {s.label}
            </Link>
            {i < steps.length - 1 && <span aria-hidden className="h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
