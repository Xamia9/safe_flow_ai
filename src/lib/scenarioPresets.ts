import type { Horizon, Scenario, ScenarioKind } from "@/types/financial";
import { suggestedReductionPct } from "./financialCalculations";

export interface PresetMeta {
  kind: ScenarioKind;
  label: string;
  description: string;
}

/** Preset starting values — every value is editable by the user. */
export const PRESET_DEFAULTS = {
  /** Used when no reduction can be derived from low-season income. Neutral, not an estimate. */
  neutralReductionPct: 0,
  interruptionPct: 100,
  interruptionStartMonth: 1,
  interruptionMonths: 1,
  /** Unexpected expense = this many months of essential expenses, in month 1. */
  unexpectedExpenseMonthsOfEssentials: 1,
} as const;

export const presetMeta: PresetMeta[] = [
  { kind: "baseline", label: "Baseline", description: "Normal income, no shocks." },
  { kind: "income-reduction", label: "Income Reduction", description: "Income drops for a number of months." },
  { kind: "interruption", label: "Temporary Income Interruption", description: "No income for a period." },
  { kind: "unexpected-expense", label: "Unexpected Expense", description: "A one-off cost in one month." },
  { kind: "combined", label: "Combined Shock", description: "Income reduction plus an unexpected cost." },
];

export interface PresetInputs {
  normalIncome: number;
  lowSeasonIncome: number;
  essentialExpenses: number;
}

/** Reduction suggested from low-season income; 0 and derived=false when none can be calculated. */
export function suggestedReduction(i: PresetInputs): { pct: number; derived: boolean } {
  const pct = suggestedReductionPct(i.normalIncome, i.lowSeasonIncome);
  return pct > 0 ? { pct, derived: true } : { pct: PRESET_DEFAULTS.neutralReductionPct, derived: false };
}

export function buildPreset(kind: ScenarioKind, horizon: Horizon, i: PresetInputs): Scenario {
  const label = presetMeta.find((p) => p.kind === kind)!.label;
  const base: Scenario = { name: label, kind, horizon, incomeReductionPct: 0, interruption: null, unexpectedExpenses: [] };
  const reduction = Math.round(suggestedReduction(i).pct);
  const whole = { startMonth: 1, durationMonths: horizon };
  const expense = { month: 1, amount: i.essentialExpenses * PRESET_DEFAULTS.unexpectedExpenseMonthsOfEssentials, label: "Unexpected expense" };
  switch (kind) {
    case "income-reduction":
      return { ...base, incomeReductionPct: reduction, interruption: whole };
    case "interruption":
      return {
        ...base,
        incomeReductionPct: PRESET_DEFAULTS.interruptionPct,
        interruption: { startMonth: PRESET_DEFAULTS.interruptionStartMonth, durationMonths: Math.min(PRESET_DEFAULTS.interruptionMonths, horizon) },
      };
    case "unexpected-expense":
      return { ...base, unexpectedExpenses: [expense] };
    case "combined":
      return { ...base, incomeReductionPct: reduction, interruption: whole, unexpectedExpenses: [expense] };
    default:
      return base;
  }
}

export const defaultScenario: Scenario = {
  name: "Baseline",
  kind: "baseline",
  horizon: 6,
  incomeReductionPct: 0,
  interruption: null,
  unexpectedExpenses: [],
};
