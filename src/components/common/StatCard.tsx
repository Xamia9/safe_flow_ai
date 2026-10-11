import { cn } from "@/lib/utils";

type Tone = "default" | "warning" | "negative" | "positive";
const tones: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-teal",
  warning: "text-warning",
  negative: "text-negative",
};

export function StatCard({ label, value, hint, tone = "default" }: {
  label: string; value: string; hint?: string | undefined; tone?: Tone;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-display text-xl font-bold tabular", tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
