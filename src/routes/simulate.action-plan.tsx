import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileText, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { RiskBadge } from "@/components/common/RiskBadge";
import { Button } from "@/components/ui/button";
import { simulate } from "@/lib/financialCalculations";
import { formatVND } from "@/lib/formatCurrency";
import { useSimulation } from "@/services/simulationStore";

export const Route = createFileRoute("/simulate/action-plan")({
  head: () => ({
    meta: [
      { title: "Action Plan & Report — SafeFlow AI" },
      { name: "description", content: "Summary of your simulation and next steps to strengthen your cash-flow resilience." },
      { property: "og:title", content: "Action Plan & Report — SafeFlow AI" },
      { property: "og:description", content: "Your SafeFlow simulation summary and action plan." },
    ],
  }),
  component: ActionPlan,
});

function ActionPlan() {
  const { profile, scenario } = useSimulation();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Step 3" title="Action plan & report" />
      {!profile ? (
        <EmptyState icon={ClipboardList} title="Nothing to report yet"
          description="Run a simulation first. Your summary and action plan will appear here."
          action={<Button asChild><Link to="/simulate/input">Go to profile</Link></Button>} />
      ) : (
        <Summary />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <EmptyState icon={Sparkles} title="AI action plan — coming soon"
          description="Personalised recommendations from the SafeFlow assistant are not available in this version." />
        <EmptyState icon={FileText} title="Report export — coming soon"
          description="Downloading a PDF report is not available yet." />
      </div>
    </div>
  );

  function Summary() {
    const r = simulate(profile!, scenario);
    return (
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Simulation summary</h2>
          <RiskBadge level={r.risk.level} />
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {[
            ["Horizon", `${scenario.horizon} months`],
            ["Income reduction", `${scenario.incomeReductionPct}%`],
            ["Lowest projected balance", formatVND(r.lowestBalance)],
            ["Ending balance", formatVND(r.endingBalance)],
            ["Minimum income needed", formatVND(r.minimumIncomeNeeded)],
            ["Largest monthly gap", formatVND(r.maxMonthlyGap)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium tabular">{v}</dd></div>
          ))}
        </dl>
        <ul className="mt-4 list-disc pl-5 text-sm">{r.risk.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
    );
  }
}
