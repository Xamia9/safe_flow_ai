import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Plus, RotateCcw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AmountField } from "@/components/forms/AmountField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { parseAmount, parseProfileDraft, validateScenario, type Errors } from "@/lib/validation";
import { formatWithCaret } from "@/lib/formatInput";
import { buildPreset, presetMeta, suggestedReduction } from "@/lib/scenarioPresets";
import { setDuration, setHorizon, usesReduction } from "@/lib/scenarioUpdates";
import { compareScenarios } from "@/lib/financialCalculations";
import { formatVND } from "@/lib/formatCurrency";
import { resetSimulation, setDraftValue, setSimulation, useSimulation } from "@/services/simulationStore";
import type { Horizon, Scenario } from "@/types/financial";

export const Route = createFileRoute("/simulate/input")({
  head: () => ({
    meta: [
      { title: "Financial Profile & Scenario — SafeFlow AI" },
      { name: "description", content: "Enter your income, expenses and savings, then choose a stress scenario to simulate." },
      { property: "og:title", content: "Financial Profile & Scenario — SafeFlow AI" },
      { property: "og:description", content: "Set up your cash-flow profile and stress scenario." },
    ],
  }),
  component: InputPage,
});

const fields = [
  { key: "monthlyIncome", label: "Normal monthly net income", hint: "Take-home pay in a typical month." },
  { key: "lowSeasonIncome", label: "Low-season monthly net income", hint: "Take-home pay in a slow month." },
  { key: "essentialExpenses", label: "Essential living expenses", hint: "Rent, food, utilities, transport. Exclude debt payments." },
  { key: "openingBalance", label: "Available emergency savings", hint: "Cash you could use today." },
  { key: "debtPayments", label: "Mandatory debt payment", hint: "Minimum monthly repayments. Enter 0 if none." },
  { key: "flexibleExpenses", label: "Flexible spending", hint: "Non-essential spending. Blank counts as 0.", optional: true },
] as const;

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-US") : "");

function InputPage() {
  const { draft, scenario: sc } = useSimulation();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [confirmedLow, setConfirmedLow] = useState(false);

  const setSc = (next: Scenario) => setSimulation({ scenario: next });
  const live = parseProfileDraft(draft);
  const num = (k: string) => {
    const n = parseAmount(draft[k]);
    return n !== null && Number.isFinite(n) ? n : 0;
  };
  const presetInputs = { normalIncome: num("monthlyIncome"), lowSeasonIncome: num("lowSeasonIncome"), essentialExpenses: num("essentialExpenses") };
  const suggestion = suggestedReduction(presetInputs);
  const lowWarning = live.warnings["lowSeasonIncome"];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { profile, errors: pe } = parseProfileDraft(draft);
    const errs = { ...pe, ...validateScenario(sc) };
    if (lowWarning && !confirmedLow) errs["lowConfirm"] = "Please confirm your low-season income before running.";
    setErrors(errs);
    if (Object.keys(errs).length || !profile) {
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    compareScenarios(profile, sc);
    setSimulation({ profile, scenario: sc });
    navigate({ to: "/simulate/dashboard" });
  };

  const updateExp = (i: number, patch: Partial<Scenario["unexpectedExpenses"][number]>) =>
    setSc({ ...sc, unexpectedExpenses: sc.unexpectedExpenses.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <PageHeader eyebrow="Step 1" title="Financial profile & scenario"
        description="All amounts are monthly and in VND. Inputs are saved only in this browser on this device and are not synced anywhere."
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline"><RotateCcw /> Start fresh</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start a fresh simulation?</AlertDialogTitle>
                <AlertDialogDescription>This deletes all inputs and results saved in this browser. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { resetSimulation(); setErrors({}); setConfirmedLow(false); }}>Delete saved data</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        } />

      <section className="rounded-xl border bg-card p-6" aria-labelledby="profile-h">
        <h2 id="profile-h" className="text-lg font-semibold">Your monthly profile</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <AmountField key={f.key} id={f.key} label={f.label} hint={f.hint} optional={"optional" in f}
              value={draft[f.key] ?? ""} error={errors[f.key]}
              onChange={(v) => { setDraftValue(f.key, v); if (f.key === "lowSeasonIncome" || f.key === "monthlyIncome") setConfirmedLow(false); }} />
          ))}
        </div>
        {lowWarning && (
          <div role="status" className="mt-5 flex flex-wrap items-start gap-3 rounded-lg bg-warning-soft p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" aria-hidden />
            <p className="flex-1">{lowWarning}</p>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={confirmedLow} onChange={(e) => setConfirmedLow(e.target.checked)} className="h-4 w-4 accent-[var(--teal)]" />
              Yes, this is correct
            </label>
            {errors["lowConfirm"] && !confirmedLow && <p className="w-full text-negative">{errors["lowConfirm"]}</p>}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6" aria-labelledby="sc-h">
        <h2 id="sc-h" className="text-lg font-semibold">Stress scenario</h2>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Forecast horizon</legend>
          <div className="mt-2 inline-flex rounded-lg border p-1" role="radiogroup" aria-label="Forecast horizon">
            {([3, 6, 12] as Horizon[]).map((h) => (
              <button type="button" key={h} role="radio" aria-checked={sc.horizon === h}
                onClick={() => setSc(setHorizon(sc, h))}
                className={cn("rounded-md px-4 py-1.5 text-sm font-medium", sc.horizon === h ? "bg-navy text-navy-foreground" : "text-muted-foreground")}>
                {h} months
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">Scenario type</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" role="radiogroup" aria-label="Scenario type">
            {presetMeta.map((p) => (
              <button type="button" key={p.kind} role="radio" aria-checked={sc.kind === p.kind}
                onClick={() => setSc(buildPreset(p.kind, sc.horizon, presetInputs))}
                className={cn("rounded-lg border p-3 text-left", sc.kind === p.kind && "border-teal bg-teal-soft")}>
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.description}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Picking a scenario fills in illustrative assumptions. Edit any value below to match your situation.
          </p>
        </fieldset>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reduction">Income reduction (%)</Label>
            <Input id="reduction" type="number" min={0} max={100} step={1} className="w-32 tabular"
              value={sc.incomeReductionPct}
              aria-invalid={!!errors["incomeReductionPct"]}
              onChange={(e) => setSc({ ...sc, incomeReductionPct: e.target.value === "" ? 0 : Number(e.target.value) })} />
            <p className={cn("text-xs", errors["incomeReductionPct"] ? "text-negative" : "text-muted-foreground")}>
              {errors["incomeReductionPct"] ?? (suggestion.derived
                ? `Suggested from your low-season income: ${suggestion.pct.toFixed(1)}% (rounded to ${Math.round(suggestion.pct)}%).`
                : "No suggested reduction available (low-season income is not below normal income). Starting at 0% — edit as needed.")}
            </p>
            {suggestion.derived && sc.incomeReductionPct !== Math.round(suggestion.pct) && (
              <Button type="button" variant="link" size="sm" className="h-auto p-0"
                onClick={() => setSc({ ...sc, incomeReductionPct: Math.round(suggestion.pct) })}>
                Use suggested {Math.round(suggestion.pct)}%
              </Button>
            )}
          </div>

          {usesReduction(sc) && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Affected months</p>
              <div className="flex flex-wrap gap-3">
                <div>
                  <Label htmlFor="int-start" className="text-xs">Starting month</Label>
                  <select id="int-start" value={sc.interruption?.startMonth ?? 1}
                    onChange={(e) => setSc(setDuration({ ...sc, interruption: { startMonth: Number(e.target.value), durationMonths: sc.interruption?.durationMonths ?? sc.horizon } }, sc.interruption?.durationMonths ?? sc.horizon))}
                    className="mt-1 block h-9 rounded-md border border-input bg-card px-2 text-sm">
                    {Array.from({ length: sc.horizon }, (_, k) => <option key={k} value={k + 1}>Month {k + 1}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="int-dur" className="text-xs">Number of months</Label>
                  <Input id="int-dur" type="number" min={1} max={sc.horizon - (sc.interruption?.startMonth ?? 1) + 1} step={1} className="mt-1 w-24 tabular"
                    value={sc.interruption?.durationMonths ?? sc.horizon} aria-invalid={!!errors["interruption.duration"]}
                    onChange={(e) => setSc(setDuration(sc, Number(e.target.value)))} />
                </div>
                {(errors["interruption.start"] || errors["interruption.duration"]) && (
                  <p className="w-full text-xs text-negative">{errors["interruption.start"] ?? errors["interruption.duration"]}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">The reduction applies only in these months. 100% means no income.</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">Unexpected expenses</p>
          {sc.unexpectedExpenses.length === 0 && <p className="mt-1 text-xs text-muted-foreground">None added.</p>}
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
                  <Input id={`a${i}`} inputMode="numeric" className="mt-1 w-44 tabular" value={fmt(x.amount)}
                    onChange={(e) => { const formatted = formatWithCaret(e.target.value, e.target); const n = parseAmount(formatted); updateExp(i, { amount: n === null ? 0 : n }); }}
                    aria-invalid={!!errors[`unexpected.${i}.amount`]} />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove expense ${i + 1}`}
                  onClick={() => setSc({ ...sc, unexpectedExpenses: sc.unexpectedExpenses.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
                {errors[`unexpected.${i}.amount`] && <p className="w-full text-xs text-negative">{errors[`unexpected.${i}.amount`]}</p>}
              </li>
            ))}
          </ul>
          {(sc.kind === "unexpected-expense" || sc.kind === "combined") && (
            <p className="mt-2 text-xs text-muted-foreground">
              Illustrative default: one month of essential expenses ({formatVND(presetInputs.essentialExpenses)}) in month 1.
            </p>
          )}
          <Button type="button" variant="outline" size="sm" className="mt-3"
            onClick={() => setSc({ ...sc, unexpectedExpenses: [...sc.unexpectedExpenses, { month: 1, amount: 0 }] })}>
            <Plus /> Add expense
          </Button>
        </div>

        <div className="mt-6 rounded-lg bg-secondary p-3 text-sm">
          <p className="font-medium">Safety buffer: {formatVND(presetInputs.essentialExpenses + num("debtPayments"))}</p>
          <p className="text-xs text-muted-foreground">Always one month of essential expenses plus mandatory debt payment (E + D).</p>
        </div>
      </section>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-lg border border-negative/30 bg-negative-soft p-3 text-sm text-negative">Please fix the highlighted fields.</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg">Run Simulation</Button>
      </div>
    </form>
  );
}
