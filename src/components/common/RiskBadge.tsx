import type { RiskLevel } from "@/types/financial";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageContext";
import { riskLevelLabel } from "@/lib/localizedContent";

const styles: Record<RiskLevel, string> = {
  Low: "bg-teal-soft text-teal",
  Medium: "bg-warning-soft text-warning",
  High: "bg-negative-soft text-negative",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const t = useT();
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-sm font-semibold", styles[level])}>
      {riskLevelLabel(level, t)}
    </span>
  );
}
