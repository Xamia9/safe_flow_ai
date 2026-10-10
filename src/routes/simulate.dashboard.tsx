import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { RiskBadge } from "@/components/common/RiskBadge";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { Button } from "@/components/ui/button";
import { compareScenarios } from "@/lib/financialCalculations";
import { formatMonths, formatVND } from "@/lib/formatCurrency";
import { useSimulation } from "@/services/simulationStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulate/dashboard")({
  head: () => ({
    meta: [
      { title: "Risk Dashboard — SafeFlow AI" },
      { name: "description", content: "Projected balances, shortfall months and risk level for your scenario." },
      { property: "og:title", content: "Risk Dashboard — SafeFlow AI" },
      { property: "og:description", content: "See how your cash flow holds up under stress." },
    ],
  }),
  component: Dashboard,
});

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
  const { baseline, active, deltaEndingBalance } = compareScenarios(profile, scenario);
  const tone = (v: number) => (v < 0 ? "negative" : v < profile.safetyBuffer ? "warning" : "default") as const;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Step 2" title="Risk dashboard"
        description={`${scenario.horizon}-month projection with ${scenario.incomeReductionPct}% income reduction${scenario.unexpectedExpenses.length ? " and unexpected costs" : ""}.`}
        actions={<Button asChild variant="outline"><Link to="/simulate/input">Edit inputs</Link></Button>} />

      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge level={active.risk.level} />
          <span className="text-sm text-muted-foreground">Rule-based rating, not a probability.</span>
        </div>
        <ul className="mt-3 list-disc pl-5 text-sm">
          {active.risk.reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key figures">
        <StatCard label="Lowest balance" value={formatVND(active.lowestBalance)} tone={tone(active.lowestBalance)} />
        <StatCard label="Ending balance" value={formatVND(active.endingBalance)} tone={tone(active.endingBalance)}
          hint={`${deltaEndingBalance >= 0 ? "+" : ""}${formatVND(deltaEndingBalance)} vs baseline`} />
        <StatCard label="First month below buffer" value={active.firstMonthBelowBuffer ? `Month ${active.firstMonthBelowBuffer}` : "None"} tone={active.firstMonthBelowBuffer ? "warning" : "positive"} />
        <StatCard label="First negative month" value={active.firstNegativeMonth ? `Month ${active.firstNegativeMonth}` : "None"} tone={active.firstNegativeMonth ? "negative" : "positive"} />
        <StatCard label="Max monthly gap" value={formatVND(active.maxMonthlyGap)} tone={active.maxMonthlyGap > 0 ? "warning" : "default"} />
        <StatCard label="Max reserve deficit" value={formatVND(active.maxReserveDeficit)} tone={active.maxReserveDeficit > 0 ? "warning" : "default"} />
        <StatCard label="Runway with zero income" value={formatMonths(active.runwayMonthsZeroIncome)} />
        <StatCard label="Minimum income needed" value={formatVND(active.minimumIncomeNeeded)} hint="Essentials + mandatory debt" />
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Projected month-end balance</h2>
        <div className="mt-4"><BalanceChart active={active.months} baseline={baseline.months} buffer={profile.safetyBuffer} /></div>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm tabular">
          <caption className="p-4 text-left font-display text-lg font-semibold">Monthly breakdown</caption>
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>{["Month", "Income", "Outflow", "Net", "Scenario balance", "Baseline balance"].map((h) => <th key={h} scope="col" className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {active.months.map((m, i) => (
              <tr key={m.month} className="border-t">
                <td className="px-4 py-2">{m.month}</td>
                <td className="px-4 py-2">{formatVND(m.income)}</td>
                <td className="px-4 py-2">{formatVND(m.outflow)}</td>
                <td className={cn("px-4 py-2", m.netCashFlow < 0 && "text-negative")}>{formatVND(m.netCashFlow)}</td>
                <td className={cn("px-4 py-2 font-medium", m.negative ? "text-negative" : m.belowBuffer && "text-warning")}>{formatVND(m.closingBalance)}</td>
                <td className="px-4 py-2 text-muted-foreground">{formatVND(baseline.months[i].closingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex justify-end">
        <Button asChild size="lg"><Link to="/simulate/action-plan">Continue to action plan</Link></Button>
      </div>
    </div>
  );
}
