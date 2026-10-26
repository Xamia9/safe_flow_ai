import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { getLocalizedServicesForSolution } from "@/lib/relevantServicesLocalized";
import type { SolutionId } from "@/lib/recommendations";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageContext";

export function RelevantServices({ solutionId }: { solutionId: SolutionId }) {
  const t = useT();
  const category = getLocalizedServicesForSolution(solutionId, t);
  const [open, setOpen] = useState(false);
  if (!category || category.services.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="w-full justify-between px-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <span>{t("services.explore")}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{category.sectionTitle}</p>
        <ul className="space-y-1.5">
          {category.services.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 text-sm text-teal hover:text-teal/80 hover:underline"
              >
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  <span className="font-medium">{s.provider}</span>
                  <span className="block text-xs text-muted-foreground">{s.description}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs italic text-muted-foreground">{t("services.transparency")}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}
