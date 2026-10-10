import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AmountField } from "@/components/forms/AmountField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { parseAmount, validateProfile, validateScenario, type Errors } from "@/lib/validation";
import { scenarioPresets } from "@/lib/scenarioPresets";
import { setSimulation, useSimulation } from "@/services/simulationStore";
import type { FinancialProfile, Horizon, Scenario } from "@/types/financial";

export const Route = createFileRoute("/simulate/input")({
  head: () => ({
    meta: [
      { title: "Financial Profile & Scenario — SafeFlow AI" },
      { name: "description", content: "Enter your income, expenses, savings and choose a stress scenario to simulate." },
      { property: "og:title", content: "Financial Profile & Scenario — SafeFlow AI" },
      { property: "og:description", content: "Set up your cash-flow profile and stress scenario." },
    ],
  }),
  component: InputPage,
});

const fields = [
  { key: "monthlyIncome", label: "Monthly net income", hint: "Take-home pay after tax." },
  { key: "essentialExpenses", label: "Essential expenses", hint: "Rent, food, utilities, transport." },
  { key: "flexibleExpenses", label: "Flexible spending", hint: "Leave blank if none.", optional: true },
  { key: "debtPayments", label: "Mandatory debt payments", hint: "Minimum monthly repayments." },
  { key: "openingBalance", label: "Current savings", hint: "Cash available today." },
  { key: "safetyBuffer", label: "Safety buffer", hint: "Minimum balance you want to keep." },
] as const;

type Key = (typeof fields)[number]["key"];
const toStr = (n: number | null | undefined) => (n == null ? "" : n.toLocaleString("en-US"));

function InputPage() {
  const { profile, scenario } = useSimulation();
  const navigate = useNavigate();
  const [vals, setVals] = useState<Record<Key, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, toStr(profile?.[f.key])])) as Record<Key, string>,
  );
  const [sc, setSc] = useState<Scenario>(scenario);
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = (k: Key) => parseAmount(vals[k]);
    const p: FinancialProfile = {
      openingBalance: num("openingBalance") ?? NaN,
      monthlyIncome: num("monthlyIncome") ?? NaN,
      essentialExpenses: num("essentialExpenses") ?? NaN,
      flexibleExpenses: num("flexibleExpenses"),
      debtPayments: num("debtPayments") ?? 0,
      safetyBuffer: num("safetyBuffer") ?? 0,
    };
    const errs = { ...validateProfile(p), ...validateScenario(sc) };
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSimulation({ profile: p, scenario: sc });
    navigate({ to: "/simulate/dashboard" });
  };

  const updateExp = (i: number, patch: Partial<Scenario["unexpectedExpenses"][number]>) =>
    setSc({ ...sc, unexpectedExpenses: sc.unexpectedExpenses.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <PageHeader eyebrow="Step 1" title="Financial profile & scenario" description="All amounts are monthly and in VND. Your data stays in this browser tab." />

      <section className="rounded-xl border bg-card p-6" aria-labelledby="profile-h">
        <h2 id="profile-h" className="text-lg font-semibold">Your monthly profile</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <AmountField key={f.key} id={f.key} label={f.label} hint={f.hint} optional={"optional" in f}
              value={vals[f.key]} error={errors[f.key]}
              onChange={(v) => setVals({ ...vals, [f.key]: v })} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6" aria-labelledby="sc-h">
        <h2 id="sc-h" className="text-lg font-semibold">Stress scenario</h2>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Forecast horizon</legend>
          <div className="mt-2 inline-flex rounded-lg border p-1" role="radiogroup">
            {([3, 6, 12] as Horizon[]).map((h) => (
              <button type="button" key={h} role="radio" aria-checked={sc.horizon === h}
                onClick={() => setSc({ ...sc, horizon: h, unexpectedExpenses: sc.unexpectedExpenses.filter((x) => x.month <= h) })}
                className={cn("rounded-md px-4 py-1.5 text-sm font-medium", sc.horizon === h ? "bg-navy text-navy-foreground" : "text-muted-foreground")}>
                {h} months
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <p className="text-sm font-medium">Quick presets</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {scenarioPresets.map((p) => (
              <button type="button" key={p.id} onClick={() => setSc({ ...sc, incomeReductionPct: p.incomeReductionPct })}
                className={cn("rounded-lg border p-3 text-left", sc.incomeReductionPct === p.incomeReductionPct && "border-teal bg-teal-soft")}>
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 max-w-md space-y-2">
          <Label htmlFor="reduction">Income reduction: <span className="tabular">{sc.incomeReductionPct}%</span></Label>
          <Slider id="reduction" min={0} max={100} step={5} value={[sc.incomeReductionPct]}
            aria-label="Income reduction percentage"
            onValueChange={([v]) => setSc({ ...sc, incomeReductionPct: v ?? 0 })} />
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">Unexpected expenses</p>
          <ul className="mt-2 space-y-2">
            {sc.unexpectedExpenses.map((x, i) => (
              <li key={i} className="flex flex-wrap items-end gap-2">
                <div>
                  <Label htmlFor={`m${i}`} className="text-xs">Month</Label>
                  <select id={`m${i}`} value={x.month} onChange={(e) => updateExp(i, { month: Number(e.target.value) })}
                    className="mt-1 block h-9 rounded-md border border-input bg-card px-2 text-sm">
                    {Array.from({ length: sc.horizon }, (_, k) => <option key={k} value={k + 1}>Month {k + 1}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor={`a${i}`} className="text-xs">Amount (VND)</Label>
                  <Input id={`a${i}`} inputMode="numeric" className="mt-1 w-44 tabular" value={toStr(x.amount)}
                    onChange={(e) => updateExp(i, { amount: parseAmount(e.target.value) ?? 0 })}
                    aria-invalid={!!errors[`unexpected.${i}.amount`]} />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove expense ${i + 1}`}
                  onClick={() => setSc({ ...sc, unexpectedExpenses: sc.unexpectedExpenses.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" className="mt-3"
            onClick={() => setSc({ ...sc, unexpectedExpenses: [...sc.unexpectedExpenses, { month: 1, amount: 0 }] })}>
            <Plus /> Add expense
          </Button>
        </div>
      </section>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-lg bg-negative-soft p-3 text-sm text-negative">Please fix the highlighted fields.</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg">Run simulation</Button>
      </div>
    </form>
  );
}
