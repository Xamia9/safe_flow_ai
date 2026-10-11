/**
 * Pure scenario transformations used by the dashboard controls.
 * Each returns a new Scenario; the input is never mutated.
 */
import type { FinancialProfile, Horizon, Scenario } from "@/types/financial";
import { buildPreset, presetMeta } from "./scenarioPresets";

const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)));

export const usesReduction = (s: Scenario) =>
  s.kind === "income-reduction" || s.kind === "interruption" || s.kind === "combined";
export const usesExpense = (s: Scenario) => s.kind === "unexpected-expense" || s.kind === "combined";

export function setReductionPct(s: Scenario, pct: number): Scenario {
  return { ...s, incomeReductionPct: clampInt(pct, 0, 100) };
}

/** Duration of the affected window, 1..(horizon − start + 1). */
export function setDuration(s: Scenario, months: number): Scenario {
  const start = s.interruption?.startMonth ?? 1;
  return { ...s, interruption: { startMonth: start, durationMonths: clampInt(months, 1, s.horizon - start + 1) } };
}

/** Dashboard edits the first unexpected expense; creates one if missing. */
export function setExpense(s: Scenario, patch: { amount?: number; month?: number }): Scenario {
  const cur = s.unexpectedExpenses[0] ?? { month: 1, amount: 0, label: "Unexpected expense" };
  const next = {
    ...cur,
    ...(patch.amount !== undefined ? { amount: Math.max(0, Number.isFinite(patch.amount) ? patch.amount : 0) } : {}),
    ...(patch.month !== undefined ? { month: clampInt(patch.month, 1, s.horizon) } : {}),
  };
  return { ...s, unexpectedExpenses: [next, ...s.unexpectedExpenses.slice(1)] };
}

/** Change horizon, keeping windows and expense months inside it. */
export function setHorizon(s: Scenario, h: Horizon): Scenario {
  let interruption = s.interruption ?? null;
  if (interruption) {
    const start = Math.min(interruption.startMonth, h);
    interruption = { startMonth: start, durationMonths: clampInt(interruption.durationMonths, 1, h - start + 1) };
  }
  return { ...s, horizon: h, interruption, unexpectedExpenses: s.unexpectedExpenses.filter((x) => x.month <= h) };
}

/** Restore the active preset's assumptions; the profile is untouched. */
export function resetScenario(s: Scenario, p: FinancialProfile): Scenario {
  return buildPreset(s.kind ?? "baseline", s.horizon, {
    normalIncome: p.monthlyIncome,
    lowSeasonIncome: p.lowSeasonIncome ?? p.monthlyIncome,
    essentialExpenses: p.essentialExpenses,
  });
}

export interface ScenarioSummary {
  label: string;
  reductionPct: number | null;
  affectedMonths: string | null;
  expense: { amount: number; month: number } | null;
  horizon: Horizon;
}

export function describeScenario(s: Scenario): ScenarioSummary {
  const label = presetMeta.find((m) => m.kind === (s.kind ?? "baseline"))?.label ?? s.name;
  const w = s.interruption;
  const affected = usesReduction(s)
    ? w
      ? w.durationMonths === 1
        ? `Month ${w.startMonth}`
        : `Months ${w.startMonth}–${w.startMonth + w.durationMonths - 1}`
      : `Months 1–${s.horizon}`
    : null;
  const total = s.unexpectedExpenses.reduce((a, e) => a + e.amount, 0);
  return {
    label,
    reductionPct: usesReduction(s) ? s.incomeReductionPct : null,
    affectedMonths: affected,
    expense: usesExpense(s) && s.unexpectedExpenses[0] ? { amount: total, month: s.unexpectedExpenses[0].month } : null,
    horizon: s.horizon,
  };
}
