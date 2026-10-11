import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardList, FileText, Plus, RotateCcw, Sparkles, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { RiskBadge } from "@/components/common/RiskBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { simulate } from "@/lib/financialCalculations";
import { formatVND } from "@/lib/formatCurrency";
import { parseAmount } from "@/lib/validation";
import { useSimulation } from "@/services/simulationStore";
import { describeScenario } from "@/lib/scenarioUpdates";
import { cn } from "@/lib/utils";
import {
  type Adjustment,
  type AdjustmentKind,
  type ExperimentState,
  adjustmentHints,
  adjustmentLabels,
  addAdjustment,
  removeAdjustment,
  resetExperiment,
  runExperiment,
  updateAdjustment,
} from "@/lib/actionExperiments";
import type { FinancialProfile, RiskLevel, Scenario } from "@/types/financial";

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
  if (!profile) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Step 3" title="Action plan & report" />
        <EmptyState icon={ClipboardList} title="Nothing to report yet"
          description="Run a simulation first. Your summary and action plan will appear here."
          action={<Button asChild><Link to="/simulate/input">Go to profile</Link></Button>} />
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Step 3" title="Action plan & report"
        description="Review your results and test how changes could improve your resilience. Projections are estimates, not guarantees." />
      <Summary profile={profile} scenario={scenario} />
      <ExperimentPanel profile={profile} scenario={scenario} />
      <div className="grid gap-4 md:grid-cols-2">
        <EmptyState icon={Sparkles} title="AI action plan — coming soon"
          description="Personalised recommendations from the SafeFlow assistant are not available in this version." />
        <EmptyState icon={FileText} title="Report export — coming soon"
          description="Downloading a PDF report is not available yet." />
      </div>
    </div>
  );
}

function Summary({ profile, scenario }: { profile: FinancialProfile; scenario: Scenario }) {
  const r = simulate(profile, scenario);
  const summary = describeScenario(scenario);
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Simulation summary</h2>
        <RiskBadge level={r.risk.level} />
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        {[
          ["Scenario", summary.label],
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

const adjustmentKinds: AdjustmentKind[] = ["cutFlexible", "cutEssentials", "raiseIncome"];
const fmtInput = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-US") : "");

function ExperimentPanel({ profile, scenario }: { profile: FinancialProfile; scenario: Scenario }) {
  const [exp, setExp] = useState<ExperimentState>({ adjustments: [] });
  const cmp = useMemo(
    () => runExperiment(profile, scenario, exp.adjustments),
    [profile, scenario, exp.adjustments],
  );
  const hasAdjustments = exp.adjustments.length > 0;

  const addOne = () => setExp((s) => addAdjustment(s, { kind: "cutFlexible", amount: 0 }));
  const removeOne = (i: number) => setExp((s) => removeAdjustment(s, i));
  const patchOne = (i: number, patch: Partial<Adjustment>) => setExp((s) => updateAdjustment(s, i, patch));
  const reset = () => setExp(resetExperiment());

  return (
    <section className="rounded-xl border bg-card p-6" aria-labelledby="exp-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="exp-h" className="text-lg font-semibold">Test an adjustment</h2>
          <p className="text-xs text-muted-foreground">
            Try changes without affecting your saved profile. The comparison uses the same formulas as your dashboard.
          </p>
        </div>
        {hasAdjustments && (
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            <RotateCcw /> Clear adjustments
          </Button>
        )}
      </div>

      <ul className="mt-5 space-y-3">
        {exp.adjustments.map((a, i) => (
          <li key={i} className="rounded-lg border p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="flex-1 min-w-[160px]">
                <Label htmlFor={`kind-${i}`} className="text-xs">Adjustment</Label>
                <select id={`kind-${i}`} value={a.kind}
                  onChange={(e) => patchOne(i, { kind: e.target.value as AdjustmentKind })}
                  className="mt-1 block h-9 w-full rounded-md border border-input bg-card px-2 text-sm">
                  {adjustmentKinds.map((k) => <option key={k} value={k}>{adjustmentLabels[k]}</option>)}
                </select>
              </div>
              <div className="sm:w-48">
                <Label htmlFor={`amt-${i}`} className="text-xs">Monthly amount (VND)</Label>
                <Input id={`amt-${i}`} inputMode="numeric" className="mt-1 w-full tabular" value={fmtInput(a.amount)}
                  onChange={(e) => { const n = parseAmount(e.target.value); patchOne(i, { amount: n === null ? 0 : n }); }} />
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove adjustment ${i + 1}`}
                onClick={() => removeOne(i)} className="shrink-0 self-end">
                <Trash2 />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{adjustmentHints[a.kind]}</p>
          </li>
        ))}
      </ul>

      {!hasAdjustments && (
        <p className="mt-4 text-sm text-muted-foreground">
          No adjustments yet. Add one to see how it could change your outcome.
        </p>
      )}

      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addOne}>
        <Plus /> Add adjustment
      </Button>

      {hasAdjustments && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Before vs after comparison">
            <ComparisonCard label="Risk level"
              before={cmp.baseline.risk.level} after={cmp.adjusted.risk.level}
              improved={cmp.riskImproved} riskCard />
            <ComparisonCard label="Lowest balance"
              before={formatVND(cmp.baseline.lowestBalance)} after={formatVND(cmp.adjusted.lowestBalance)}
              delta={cmp.deltaLowestBalance} />
            <ComparisonCard label="Ending balance"
              before={formatVND(cmp.baseline.endingBalance)} after={formatVND(cmp.adjusted.endingBalance)}
              delta={cmp.deltaEndingBalance} />
            <ComparisonCard label="Reserve deficit"
              before={formatVND(cmp.baseline.maxReserveDeficit)} after={formatVND(cmp.adjusted.maxReserveDeficit)}
              delta={cmp.deltaReserveDeficit} lowerIsBetter />
            <ComparisonCard label="Max monthly gap"
              before={formatVND(cmp.baseline.maxMonthlyGap)} after={formatVND(cmp.adjusted.maxMonthlyGap)}
              delta={cmp.deltaMaxMonthlyGap} lowerIsBetter />
            <ComparisonCard label="First buffer breach"
              before={cmp.baseline.firstMonthBelowBuffer ? `Month ${cmp.baseline.firstMonthBelowBuffer}` : "None"}
              after={cmp.adjusted.firstMonthBelowBuffer ? `Month ${cmp.adjusted.firstMonthBelowBuffer}` : "None"} />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            These are mechanical projections from the numbers you entered, not professional financial advice.
            Real-world results depend on factors a simulation cannot capture.
          </p>
        </>
      )}
    </section>
  );
}

const riskTone: Record<RiskLevel, string> = {
  Low: "text-teal",
  Medium: "text-warning",
  High: "text-negative",
};

function ComparisonCard({ label, before, after, delta, improved, lowerIsBetter, riskCard }: {
  label: string;
  before: string;
  after: string;
  delta?: number;
  improved?: boolean;
  lowerIsBetter?: boolean;
  riskCard?: boolean;
}) {
  const showDelta = delta !== undefined && delta !== 0;
  const deltaGood = lowerIsBetter ? delta! < 0 : delta! > 0;
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2">
          <span className="text-xs text-muted-foreground">Before</span>
          <span className={cn("tabular font-medium", riskCard && riskTone[before as RiskLevel])}>{before}</span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">After</span>
          <span className={cn("tabular font-medium", riskCard && riskTone[after as RiskLevel])}>{after}</span>
        </div>
        {showDelta && (
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-xs text-muted-foreground">Change</span>
            <span className={cn("flex items-center gap-1 text-xs font-medium tabular", deltaGood ? "text-teal" : "text-negative")}>
              {deltaGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta! > 0 ? "+" : ""}{formatVND(delta!)}
            </span>
          </div>
        )}
        {improved !== undefined && improved && (
          <p className="text-xs font-medium text-teal">Risk improved</p>
        )}
      </div>
    </div>
  );
}
