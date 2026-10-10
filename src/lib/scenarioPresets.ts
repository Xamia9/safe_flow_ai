import type { Horizon, Scenario, ScenarioKind } from "@/types/financial";
import { suggestedReductionPct } from "./financialCalculations";

export interface PresetMeta {
  kind: ScenarioKind;
  label: string;
  description: string;
}

/** Illustrative assumptions — every value is editable by the user. */
export const ILLUSTRATIVE = {
  fallbackReductionPct: 30,
  interruptionStartMonth: 1,
  interruptionMonths: 2,
  /** Unexpected expense = this many months of essential expenses, in month 1. */
  unexpectedExpenseMonthsOfEssentials: 1,
} as const;

export const presetMeta: PresetMeta[] = [
  { kind: "baseline", label: "Baseline", description: "Normal income, no shocks." },
  { kind: "income-reduction", label: "Income Reduction", description: "Income drops for the whole period." },
  { kind: "interruption", label: "Temporary Income Interruption", description: "No income for a few months." },
  { kind: "unexpected-expense", label: "Unexpected Expense", description: "A one-off cost in one month." },
  { kind: "combined", label: "Combined Shock", description: "Income reduction plus an unexpected cost." },
];

export interface PresetInputs {
  normalIncome: number;
  lowSeasonIncome: number;
  essentialExpenses: number;
}

/** Reduction suggested from low-season income, falling back to an illustrative value. */
export function suggestedReduction(i: PresetInputs): { pct: number; derived: boolean } {
  const pct = suggestedReductionPct(i.normalIncome, i.lowSeasonIncome);
  return pct > 0 ? { pct, derived: true } : { pct: ILLUSTRATIVE.fallbackReductionPct, derived: false };
}

export function buildPreset(kind: ScenarioKind, horizon: Horizon, i: PresetInputs): Scenario {
  const label = presetMeta.find((p) => p.kind === kind)!.label;
  const base: Scenario = { name: label, kind, horizon, incomeReductionPct: 0, interruption: null, unexpectedExpenses: [] };
  const reduction = Math.round(suggestedReduction(i).pct * 10) / 10;
  const expense = { month: 1, amount: i.essentialExpenses * ILLUSTRATIVE.unexpectedExpenseMonthsOfEssentials, label: "Unexpected expense" };
  switch (kind) {
    case "income-reduction":
      return { ...base, incomeReductionPct: reduction };
    case "interruption":
      return { ...base, interruption: { startMonth: ILLUSTRATIVE.interruptionStartMonth, durationMonths: Math.min(ILLUSTRATIVE.interruptionMonths, horizon) } };
    case "unexpected-expense":
      return { ...base, unexpectedExpenses: [expense] };
    case "combined":
      return { ...base, incomeReductionPct: reduction, unexpectedExpenses: [expense] };
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
