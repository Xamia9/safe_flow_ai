import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Plus, RotateCcw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AmountField } from "@/components/forms/AmountField";
import { NumericInput } from "@/components/forms/NumericInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { parseAmount, parseProfileDraft, validateScenario, type Errors } from "@/lib/validation";
import { buildPreset, suggestedReduction } from "@/lib/scenarioPresets";
import { setDuration, setHorizon, usesReduction } from "@/lib/scenarioUpdates";
import { compareScenarios } from "@/lib/financialCalculations";
import { formatVND } from "@/lib/formatCurrency";
import { localizedPreset, localizedValidation } from "@/lib/localizedContent";
import { resetSimulation, setDraftValue, setSimulation, useSimulation } from "@/services/simulationStore";
import { useT } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import type { Horizon, Scenario, ScenarioKind } from "@/types/financial";

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

interface FieldDef {
  key: string;
  labelKey: TranslationKey;
  hintKey: TranslationKey;
  optional?: boolean;
}

const FIELDS: FieldDef[] = [
  { key: "monthlyIncome", labelKey: "input.fMonthlyIncome", hintKey: "input.fMonthlyIncomeHint" },
  { key: "lowSeasonIncome", labelKey: "input.fLowSeasonIncome", hintKey: "input.fLowSeasonIncomeHint" },
  { key: "essentialExpenses", labelKey: "input.fEssentialExpenses", hintKey: "input.fEssentialExpensesHint" },
  { key: "openingBalance", labelKey: "input.fOpeningBalance", hintKey: "input.fOpeningBalanceHint" },
  { key: "debtPayments", labelKey: "input.fDebtPayments", hintKey: "input.fDebtPaymentsHint" },
  { key: "flexibleExpenses", labelKey: "input.fFlexibleExpenses", hintKey: "input.fFlexibleExpensesHint", optional: true },
];

const PRESET_KINDS: ScenarioKind[] = ["baseline", "income-reduction", "interruption", "unexpected-expense", "combined"];

function InputPage() {
  const t = useT();
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
    if (lowWarning && !confirmedLow) errs["lowConfirm"] = t("input.lowConfirmError");
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

  // Localize validation errors for display
  const displayErrors = localizedValidation(errors, t, sc.horizon);

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <PageHeader eyebrow={t("input.eyebrow")} title={t("input.title")}
        description={t("input.description")}
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline"><RotateCcw /> {t("input.startFresh")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("input.freshTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("input.freshBody")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("input.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => { resetSimulation(); setErrors({}); setConfirmedLow(false); }}>{t("input.deleteData")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        } />

      <section className="rounded-xl border bg-card p-6" aria-labelledby="profile-h">
        <h2 id="profile-h" className="text-lg font-semibold">{t("input.monthlyProfile")}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <AmountField key={f.key} id={f.key} label={t(f.labelKey)} hint={t(f.hintKey)} {...(f.optional ? { optional: true } : {})}
              value={draft[f.key] ?? ""} error={displayErrors[f.key]}
              onChange={(v) => { setDraftValue(f.key, v); if (f.key === "lowSeasonIncome" || f.key === "monthlyIncome") setConfirmedLow(false); }} />
          ))}
        </div>
        {lowWarning && (
          <div role="status" className="mt-5 flex flex-wrap items-start gap-3 rounded-lg bg-warning-soft p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" aria-hidden />
            <p className="flex-1">{t("input.lowWarning")}</p>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={confirmedLow} onChange={(e) => setConfirmedLow(e.target.checked)} className="h-4 w-4 accent-[var(--teal)]" />
              {t("input.lowConfirmLabel")}
            </label>
            {errors["lowConfirm"] && !confirmedLow && <p className="w-full text-negative">{displayErrors["lowConfirm"]}</p>}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6" aria-labelledby="sc-h">
        <h2 id="sc-h" className="text-lg font-semibold">{t("input.stressScenario")}</h2>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">{t("input.forecastHorizon")}</legend>
          <div className="mt-2 inline-flex rounded-lg border p-1" role="radiogroup" aria-label={t("input.horizonAria")}>
            {([3, 6, 12] as Horizon[]).map((h) => (
              <button type="button" key={h} role="radio" aria-checked={sc.horizon === h}
                onClick={() => setSc(setHorizon(sc, h))}
                className={cn("rounded-md px-4 py-1.5 text-sm font-medium", sc.horizon === h ? "bg-navy text-navy-foreground" : "text-muted-foreground")}>
                {h} {t("input.months")}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">{t("input.scenarioType")}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" role="radiogroup" aria-label={t("input.scenarioTypeAria")}>
            {PRESET_KINDS.map((kind) => {
              const meta = localizedPreset(kind, t);
              return (
                <button type="button" key={kind} role="radio" aria-checked={sc.kind === kind}
                  onClick={() => setSc(buildPreset(kind, sc.horizon, presetInputs))}
                  className={cn("rounded-lg border p-3 text-left", sc.kind === kind && "border-teal bg-teal-soft")}>
                  <span className="block text-sm font-semibold">{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("input.scenarioHint")}</p>
        </fieldset>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reduction">{t("input.incomeReduction")}</Label>
            <Input id="reduction" type="number" min={0} max={100} step={1} className="w-32 tabular"
              value={sc.incomeReductionPct}
              aria-invalid={!!errors["incomeReductionPct"]}
              onChange={(e) => setSc({ ...sc, incomeReductionPct: e.target.value === "" ? 0 : Number(e.target.value) })} />
            <p className={cn("text-xs", errors["incomeReductionPct"] ? "text-negative" : "text-muted-foreground")}>
              {displayErrors["incomeReductionPct"] ?? (suggestion.derived
                ? t("input.suggestedFrom", { pct: suggestion.pct.toFixed(1), rounded: Math.round(suggestion.pct) })
                : t("input.noSuggestion"))}
            </p>
            {suggestion.derived && sc.incomeReductionPct !== Math.round(suggestion.pct) && (
              <Button type="button" variant="link" size="sm" className="h-auto p-0"
                onClick={() => setSc({ ...sc, incomeReductionPct: Math.round(suggestion.pct) })}>
                {t("input.useSuggested", { pct: Math.round(suggestion.pct) })}
              </Button>
            )}
          </div>

          {usesReduction(sc) && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("input.affectedMonths")}</p>
              <div className="flex flex-wrap gap-3">
                <div>
                  <Label htmlFor="int-start" className="text-xs">{t("input.startingMonth")}</Label>
                  <select id="int-start" value={sc.interruption?.startMonth ?? 1}
                    onChange={(e) => setSc(setDuration({ ...sc, interruption: { startMonth: Number(e.target.value), durationMonths: sc.interruption?.durationMonths ?? sc.horizon } }, sc.interruption?.durationMonths ?? sc.horizon))}
                    className="mt-1 block h-9 rounded-md border border-input bg-card px-2 text-sm">
                    {Array.from({ length: sc.horizon }, (_, k) => <option key={k} value={k + 1}>{t("input.monthN", { n: k + 1 })}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="int-dur" className="text-xs">{t("input.numberOfMonths")}</Label>
                  <Input id="int-dur" type="number" min={1} max={sc.horizon - (sc.interruption?.startMonth ?? 1) + 1} step={1} className="mt-1 w-24 tabular"
                    value={sc.interruption?.durationMonths ?? sc.horizon} aria-invalid={!!errors["interruption.duration"]}
                    onChange={(e) => setSc(setDuration(sc, Number(e.target.value)))} />
                </div>
                {(errors["interruption.start"] || errors["interruption.duration"]) && (
                  <p className="w-full text-xs text-negative">{displayErrors["interruption.start"] ?? displayErrors["interruption.duration"]}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("input.reductionNote")}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">{t("input.unexpectedExpenses")}</p>
          {sc.unexpectedExpenses.length === 0 && <p className="mt-1 text-xs text-muted-foreground">{t("input.noneAdded")}</p>}
          <ul className="mt-2 space-y-2">
            {sc.unexpectedExpenses.map((x, i) => (
              <li key={i} className="flex flex-wrap items-end gap-2">
                <div>
                  <Label htmlFor={`m${i}`} className="text-xs">{t("input.month")}</Label>
                  <select id={`m${i}`} value={x.month} onChange={(e) => updateExp(i, { month: Number(e.target.value) })}
                    className="mt-1 block h-9 rounded-md border border-input bg-card px-2 text-sm">
                    {Array.from({ length: sc.horizon }, (_, k) => <option key={k} value={k + 1}>{t("input.monthN", { n: k + 1 })}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor={`a${i}`} className="text-xs">{t("input.amountVnd")}</Label>
                  <NumericInput id={`a${i}`} value={x.amount} onChange={(n) => updateExp(i, { amount: n })}
                    className="mt-1 w-44 tabular" ariaInvalid={!!errors[`unexpected.${i}.amount`]} />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={t("input.removeExpense", { n: i + 1 })}
                  onClick={() => setSc({ ...sc, unexpectedExpenses: sc.unexpectedExpenses.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
                {errors[`unexpected.${i}.amount`] && <p className="w-full text-xs text-negative">{displayErrors[`unexpected.${i}.amount`]}</p>}
              </li>
            ))}
          </ul>
          {(sc.kind === "unexpected-expense" || sc.kind === "combined") && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("input.illustrativeDefault", { amount: formatVND(presetInputs.essentialExpenses) })}
            </p>
          )}
          <Button type="button" variant="outline" size="sm" className="mt-3"
            onClick={() => setSc({ ...sc, unexpectedExpenses: [...sc.unexpectedExpenses, { month: 1, amount: 0 }] })}>
            <Plus /> {t("input.addExpense")}
          </Button>
        </div>

        <div className="mt-6 rounded-lg bg-secondary p-3 text-sm">
          <p className="font-medium">{t("input.safetyBuffer", { amount: formatVND(presetInputs.essentialExpenses + num("debtPayments")) })}</p>
          <p className="text-xs text-muted-foreground">{t("input.safetyBufferNote")}</p>
        </div>
      </section>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-lg bg-negative-soft p-3 text-sm text-negative">{t("input.fixFields")}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg">{t("input.runSimulation")}</Button>
      </div>
    </form>
  );
}
