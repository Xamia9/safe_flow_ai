import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { RiskBadge } from "@/components/common/RiskBadge";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { compareScenarios } from "@/lib/financialCalculations";
import { formatMonths, formatVND } from "@/lib/formatCurrency";
import { parseAmount } from "@/lib/validation";
import {
  describeScenario, resetScenario, setDuration, setExpense, setReductionPct, usesExpense, usesReduction,
} from "@/lib/scenarioUpdates";
import { setSimulation, useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";
import type { FinancialProfile, Scenario } from "@/types/financial";

export const Route = createFileRoute("/simulate/dashboard")({
  head: () => ({
    meta: [
      { title: "Risk Dashboard — SafeFlow AI" },
      { name: "description", content: "Projected balances, shortfall months and risk level for your scenario." },
      { property: "og:title", content: "Risk Dashboard — SafeFlow AI" },
      { property: "og:description", content: "See how your cash flow holds up under stress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const NONE = "Not projected within this horizon";
const monthOr = (m: number | null) => (m ? `Month ${m}` : NONE);

function Dashboard() {
  const { profile, scenario } = useSimulation();
  if (!profile) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Step 2" title="Risk dashboard" />
        <EmptyState icon={ClipboardList} title="No simulation yet"
          description="Complete your financial profile and scenario to see your projected balances and risk level."
          action={<Button asChild><Link to="/simulate/input">Go to profile</Link></Button>} />
      </div>
    );
  }
  const { baseline, active, deltaLowestBalance } = compareScenarios(profile, scenario);
  const summary = describeScenario(scenario);
  const tone = (v: number): "negative" | "warning" | "default" => (v < 0 ? "negative" : v < profile.safetyBuffer ? "warning" : "default");
  const setSc = (s: Scenario) => setSimulation({ scenario: s });

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Step 2" title="Risk dashboard"
        description="Projections based on your inputs and assumptions — not historical or actual transactions."
        actions={<Button asChild variant="outline"><Link to="/simulate/input">Edit Financial Profile</Link></Button>} />

      <section className="rounded-xl border bg-card p-6" aria-labelledby="sum-h">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="sum-h" className="sr-only">Risk summary</h2>
          <RiskBadge level={active.risk.level} />
          <span className="text-sm text-muted-foreground">Rule-based rating, not a probability.</span>
        </div>
        <ul className="mt-3 list-disc pl-5 text-sm">
          {active.risk.reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <Item k="Scenario" v={summary.label} />
          <Item k="Horizon" v={`${summary.horizon} months`} />
          {summary.reductionPct !== null && <Item k="Income reduction" v={`${summary.reductionPct}%`} />}
          {summary.affectedMonths && <Item k="Affected months" v={summary.affectedMonths} />}
          {summary.expenses.length === 1 && summary.expenses[0] && (
            <Item k="Unexpected expense" v={`${formatVND(summary.expenses[0].amount)} in month ${summary.expenses[0].month}`} />
          )}
          {summary.expenses.length > 1 && (
            <Item k="Unexpected expenses" v={summary.expenses.map((e) => `${formatVND(e.amount)} (m${e.month})`).join(" · ")} />
          )}
        </dl>
      </section>

      {(usesReduction(scenario) || usesExpense(scenario)) && (
        <Controls scenario={scenario} profile={profile} onChange={setSc} />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Key figures">
        <StatCard label="Projected ending balance" value={formatVND(active.endingBalance)} tone={tone(active.endingBalance)} />
        <StatCard label="Lowest month-end balance" value={formatVND(active.lowestBalance)} tone={tone(active.lowestBalance)}
          hint={active.lowestBalanceMonth ? `Month ${active.lowestBalanceMonth}` : undefined} />
        <StatCard label="First month below safety buffer" value={monthOr(active.firstMonthBelowBuffer)}
          tone={active.firstMonthBelowBuffer ? "warning" : "positive"} hint={`Buffer ${formatVND(profile.safetyBuffer)} (essentials + debt)`} />
        <StatCard label="First negative-balance month" value={monthOr(active.firstNegativeMonth)}
          tone={active.firstNegativeMonth ? "negative" : "positive"} hint="Savings fully used up" />
        <StatCard label="Max reserve deficit" value={formatVND(active.maxReserveDeficit)} tone={active.maxReserveDeficit > 0 ? "warning" : "default"}
          hint="Largest shortfall below zero when the balance goes negative" />
        <StatCard label="Max monthly cash-flow gap" value={formatVND(active.maxMonthlyGap)} tone={active.maxMonthlyGap > 0 ? "warning" : "default"}
          hint="Before using savings — a gap is not running out of money" />
        <StatCard label="Runway with zero income" value={formatMonths(active.runwayMonthsZeroIncome)} hint="Savings ÷ (essentials + debt)" />
        <StatCard label="Minimum income needed" value={formatVND(active.minimumIncomeNeeded)} hint="Essentials + mandatory debt per month" />
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Projected Cash Balance</h2>
        <p className="text-xs text-muted-foreground">Month-end projections, not actual transactions.</p>
        <div className="mt-4"><BalanceChart active={active.months} baseline={baseline.months} buffer={profile.safetyBuffer} scenarioLabel={summary.label} /></div>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-card" aria-labelledby="cmp-h">
        <table className="w-full text-sm tabular">
          <caption id="cmp-h" className="p-4 text-left font-display text-lg font-semibold">Scenario comparison</caption>
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr><th scope="col" className="px-4 py-2">Measure</th><th scope="col" className="px-4 py-2">Baseline</th><th scope="col" className="px-4 py-2">{summary.label}</th></tr>
          </thead>
          <tbody>
            <Row k="Ending balance" a={formatVND(baseline.endingBalance)} b={formatVND(active.endingBalance)} />
            <Row k="Lowest balance" a={formatVND(baseline.lowestBalance)} b={formatVND(active.lowestBalance)} />
            <Row k="First safety-buffer breach" a={monthOr(baseline.firstMonthBelowBuffer)} b={monthOr(active.firstMonthBelowBuffer)} />
            <Row k="First negative-balance month" a={monthOr(baseline.firstNegativeMonth)} b={monthOr(active.firstNegativeMonth)} />
            <Row k="Change in lowest balance vs baseline" a="—" b={`${deltaLowestBalance > 0 ? "+" : ""}${formatVND(deltaLowestBalance)}`} />
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-card" tabIndex={0} aria-labelledby="tbl-h">
        <table className="w-full min-w-[960px] text-sm tabular">
          <caption id="tbl-h" className="p-4 text-left font-display text-lg font-semibold">Monthly projection</caption>
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>{["Month", "Income (adjusted)", "Essentials", "Debt payment", "Flexible", "Unexpected", "Net cash flow", "Ending balance", "Buffer status"].map((h) => <th key={h} scope="col" className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {active.months.map((m) => (
              <tr key={m.month} className="border-t">
                <th scope="row" className="px-3 py-2 text-left font-medium">{m.month}</th>
                <td className="px-3 py-2">{formatVND(m.income)}</td>
                <td className="px-3 py-2">{formatVND(profile.essentialExpenses)}</td>
                <td className="px-3 py-2">{formatVND(profile.debtPayments)}</td>
                <td className="px-3 py-2">{formatVND(profile.flexibleExpenses ?? 0)}</td>
                <td className="px-3 py-2">{formatVND(m.unexpected)}</td>
                <td className={cn("px-3 py-2", m.netCashFlow < 0 && "text-negative")}>{formatVND(m.netCashFlow)}</td>
                <td className={cn("px-3 py-2 font-medium", m.negative ? "text-negative" : m.belowBuffer && "text-warning")}>{formatVND(m.closingBalance)}</td>
                <td className={cn("px-3 py-2", m.negative ? "text-negative" : m.belowBuffer ? "text-warning" : "text-teal")}>
                  {m.negative ? "Negative balance" : m.belowBuffer ? "Below buffer" : "Above buffer"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap justify-between gap-3">
        <Button asChild variant="outline"><Link to="/simulate/input">Edit Financial Profile</Link></Button>
        <Button asChild size="lg"><Link to="/simulate/action-plan">View Action Plan</Link></Button>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>;
}

function Row({ k, a, b }: { k: string; a: string; b: string }) {
  return <tr className="border-t"><th scope="row" className="px-4 py-2 text-left font-medium">{k}</th><td className="px-4 py-2">{a}</td><td className="px-4 py-2">{b}</td></tr>;
}

function Controls({ scenario: sc, profile, onChange }: { scenario: Scenario; profile: FinancialProfile; onChange: (s: Scenario) => void }) {
  const start = sc.interruption?.startMonth ?? 1;
  const maxDur = sc.horizon - start + 1;
  const dur = sc.interruption?.durationMonths ?? sc.horizon;
  const exp = sc.unexpectedExpenses[0] ?? { month: 1, amount: 0 };
  const sliderMax = Math.max(profile.essentialExpenses * 6, exp.amount, 10_000_000);
  return (
    <section className="rounded-xl border bg-card p-6" aria-labelledby="ctl-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ctl-h" className="text-lg font-semibold">Adjust scenario</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(resetScenario(sc, profile))}>
          <RotateCcw /> Reset Scenario
        </Button>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {usesReduction(sc) && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="d-red">Income reduction</Label>
                <div className="flex items-center gap-1">
                  <Input id="d-red" type="number" min={0} max={100} step={1} className="h-8 w-20 tabular" value={sc.incomeReductionPct}
                    onChange={(e) => onChange(setReductionPct(sc, Number(e.target.value)))} />
                  <span className="text-sm">%</span>
                </div>
              </div>
              <Slider aria-label="Income reduction percent" min={0} max={100} step={1} value={[sc.incomeReductionPct]}
                onValueChange={([v]) => onChange(setReductionPct(sc, v ?? 0))} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="d-dur">Duration (from month {start})</Label>
                <div className="flex items-center gap-1">
                  <Input id="d-dur" type="number" min={1} max={maxDur} step={1} className="h-8 w-20 tabular" value={dur}
                    onChange={(e) => onChange(setDuration(sc, Number(e.target.value)))} />
                  <span className="text-sm">months</span>
                </div>
              </div>
              <Slider aria-label="Duration in months" min={1} max={Math.max(1, maxDur)} step={1} value={[dur]}
                onValueChange={([v]) => onChange(setDuration(sc, v ?? 1))} />
            </div>
          </div>
        )}
        {usesExpense(sc) && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="d-amt">Unexpected expense (VND)</Label>
                <Input id="d-amt" inputMode="numeric" className="h-8 w-40 tabular" value={exp.amount.toLocaleString("en-US")}
                  onChange={(e) => { const n = parseAmount(e.target.value); onChange(setExpense(sc, { amount: n === null || Number.isNaN(n) ? 0 : n })); }} />
              </div>
              <Slider aria-label="Unexpected expense amount" min={0} max={sliderMax} step={100_000} value={[exp.amount]}
                onValueChange={([v]) => onChange(setExpense(sc, { amount: v ?? 0 }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-mon">Expense month</Label>
              <select id="d-mon" value={exp.month} onChange={(e) => onChange(setExpense(sc, { month: Number(e.target.value) }))}
                className="block h-9 rounded-md border border-input bg-card px-2 text-sm">
                {Array.from({ length: sc.horizon }, (_, k) => <option key={k} value={k + 1}>Month {k + 1}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
