/**
 * Localized string builders for content produced by the deterministic engine.
 *
 * The financial math in financialCalculations.ts stays pure and numeric-only.
 * These helpers take a translate function and the computed values and return
 * localized display strings — keeping translation concerns out of the engine.
 */
import type { FinancialProfile, Scenario, SimulationResult } from "@/types/financial";
import { usesReduction, usesExpense } from "./scenarioUpdates";
import { formatAmount } from "./formatCurrencyLocalized";
import type { TranslationKey } from "@/i18n/translations";
import type { TranslateFn as T } from "@/i18n/LanguageContext";

/** Localized risk level label, e.g. "Low risk" / "Rủi ro thấp". */
export function riskLevelLabel(level: "Low" | "Medium" | "High", t: T): string {
  const key: TranslationKey =
    level === "Low" ? "risk.low" : level === "Medium" ? "risk.medium" : "risk.high";
  return t(key);
}

/** Localized risk reasons derived from a simulation result. */
export function localizedRiskReasons(
  result: SimulationResult,
  t: T,
): string[] {
  if (result.risk.level === "High") {
    const neg = result.months.find((m) => m.negative);
    return neg ? [t("risk.reasonNegative", { n: neg.month })] : [];
  }
  if (result.risk.level === "Medium") {
    const below = result.months.find((m) => m.belowBuffer);
    return below ? [t("risk.reasonBuffer", { n: below.month })] : [];
  }
  return [t("risk.reasonStable")];
}

/** Localized affected-months range, e.g. "Months 1–3". */
export function localizedAffectedMonths(
  scenario: Scenario,
  t: T,
): string | null {
  if (!usesReduction(scenario)) return null;
  const w = scenario.interruption;
  if (w) {
    if (w.durationMonths === 1) return t("summary.month", { n: w.startMonth });
    return t("summary.monthsRange", {
      start: w.startMonth,
      end: w.startMonth + w.durationMonths - 1,
    });
  }
  return t("summary.monthsToHorizon", { horizon: scenario.horizon });
}

/** Localized priority label. */
export function priorityLabel(
  priority: "High" | "Medium" | "Preventive",
  t: T,
): string {
  const key: TranslationKey =
    priority === "High"
      ? "priority.high"
      : priority === "Medium"
        ? "priority.medium"
        : "priority.preventive";
  return t(key);
}

/** Localized adjustment kind label. */
export function adjustmentKindLabel(kind: "cutFlexible" | "cutEssentials" | "raiseIncome", t: T): string {
  const key: TranslationKey =
    kind === "cutFlexible"
      ? "adjustment.cutFlexible"
      : kind === "cutEssentials"
        ? "adjustment.cutEssentials"
        : "adjustment.raiseIncome";
  return t(key);
}

/** Localized adjustment hint. */
export function adjustmentKindHint(kind: "cutFlexible" | "cutEssentials" | "raiseIncome", t: T): string {
  const key: TranslationKey =
    kind === "cutFlexible"
      ? "adjustment.cutFlexibleHint"
      : kind === "cutEssentials"
        ? "adjustment.cutEssentialsHint"
        : "adjustment.raiseIncomeHint";
  return t(key);
}

/** Localized preset metadata (label + description) by scenario kind. */
export function localizedPreset(
  kind: Scenario["kind"],
  t: T,
): { label: string; description: string } {
  const map: Record<NonNullable<Scenario["kind"]>, { label: TranslationKey; description: TranslationKey }> = {
    baseline: { label: "preset.baseline.label", description: "preset.baseline.description" },
    "income-reduction": { label: "preset.incomeReduction.label", description: "preset.incomeReduction.description" },
    interruption: { label: "preset.interruption.label", description: "preset.interruption.description" },
    "unexpected-expense": { label: "preset.unexpectedExpense.label", description: "preset.unexpectedExpense.description" },
    combined: { label: "preset.combined.label", description: "preset.combined.description" },
  };
  const k = (kind ?? "baseline") as NonNullable<Scenario["kind"]>;
  const entry = map[k] ?? map.baseline;
  return { label: t(entry.label), description: t(entry.description) };
}

/** Localized validation messages for the profile draft + scenario. */
export function localizedValidation(
  errors: Record<string, string>,
  t: T,
  horizon: number,
): Record<string, string> {
  // Keys in `errors` are stable field ids; map known message bodies to t().
  // For messages produced by validation.ts we rebuild them from the key.
  const out: Record<string, string> = {};
  for (const [field, message] of Object.entries(errors)) {
    out[field] = localizeValidationMessage(field, message, t, horizon);
  }
  return out;
}

function localizeValidationMessage(
  field: string,
  message: string,
  t: T,
  horizon: number,
): string {
  // Match the messages produced by validation.ts by their canonical English text.
  switch (message) {
    case "This field is required.":
      return t("validation.required");
    case "Enter a number that is zero or greater.":
      return t("validation.nonNeg");
    case "Enter a number that is zero or greater, or leave blank.":
      return t("validation.flexNonNeg");
    case "Must be zero or greater.":
      return t("validation.mustNonNeg");
    case "Must be zero or greater, or left blank.":
      return t("validation.flexMustNonNeg");
    case "Choose 3, 6 or 12 months.":
      return t("validation.horizon");
    case "Must be between 0% and 100%.":
      return t("validation.reductionRange");
    default:
      if (message.startsWith("Start month must be 1–"))
        return t("validation.startMonthRange", { horizon });
      if (message === "Duration must be at least 1 month.")
        return t("validation.durationMin");
      if (message.startsWith("Affected months must end by month "))
        return t("validation.durationEndBy", { horizon });
      if (message.startsWith("Month must be 1–"))
        return t("validation.expenseMonthRange", { horizon });
      if (message === "Must be zero or greater.")
        return t("validation.expenseAmount");
      return message;
  }
}

/**
 * Localized scenario summary label (the preset label) plus affected-months text.
 * Mirrors describeScenario but emits localized strings.
 */
export function localizedScenarioLabel(scenario: Scenario, t: T): string {
  return localizedPreset(scenario.kind, t).label;
}

/** Helper used by recommendations: format an amount as "<n> VND" (unchanged). */
export function formatAmountVnd(n: number): string {
  return formatAmount(n);
}

/** Whether a scenario uses an unexpected expense (re-exported for convenience). */
export function scenarioUsesExpense(s: Scenario): boolean {
  return usesExpense(s);
}
