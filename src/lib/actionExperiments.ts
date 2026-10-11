/**
 * Pure functions for "what-if" action experiments on the Action Plan page.
 *
 * An experiment takes the user's validated profile + selected scenario and
 * produces an adjusted profile/scenario pair for comparison — without
 * mutating the originals.  The existing financial engine does all math.
 */
import type { FinancialProfile, Scenario, SimulationResult } from "@/types/financial";
import { simulate } from "./financialCalculations";

export type AdjustmentKind = "cutFlexible" | "cutEssentials" | "raiseIncome";

export interface Adjustment {
  kind: AdjustmentKind;
  /** Monthly amount in VND.  Always ≥ 0. */
  amount: number;
}

export interface ExperimentState {
  adjustments: Adjustment[];
}

export const emptyExperiment: ExperimentState = { adjustments: [] };

export function addAdjustment(
  state: ExperimentState,
  adjustment: Adjustment,
): ExperimentState {
  return { adjustments: [...state.adjustments, adjustment] };
}

export function updateAdjustment(
  state: ExperimentState,
  index: number,
  patch: Partial<Adjustment>,
): ExperimentState {
  return {
    adjustments: state.adjustments.map((a, i) =>
      i === index ? { ...a, ...patch } : a,
    ),
  };
}

export function removeAdjustment(
  state: ExperimentState,
  index: number,
): ExperimentState {
  return { adjustments: state.adjustments.filter((_, i) => i !== index) };
}

export function resetExperiment(): ExperimentState {
  return emptyExperiment;
}

/**
 * Apply adjustments to the profile, producing a new profile.
 * Does NOT mutate the original.
 *
 * - cutFlexible:  reduces flexibleExpenses by `amount` (floored at 0)
 * - cutEssentials: reduces essentialExpenses by `amount` (floored at 0)
 * - raiseIncome:  increases monthlyIncome by `amount`
 *
 * Safety buffer is recalculated as E + D after essential changes.
 */
export function applyAdjustments(
  profile: FinancialProfile,
  adjustments: Adjustment[],
): FinancialProfile {
  let flexible = profile.flexibleExpenses ?? 0;
  let essential = profile.essentialExpenses;
  let income = profile.monthlyIncome;

  for (const a of adjustments) {
    const amt = Math.max(0, a.amount);
    switch (a.kind) {
      case "cutFlexible":
        flexible = Math.max(0, flexible - amt);
        break;
      case "cutEssentials":
        essential = Math.max(0, essential - amt);
        break;
      case "raiseIncome":
        income += amt;
        break;
    }
  }

  return {
    ...profile,
    flexibleExpenses: flexible,
    essentialExpenses: essential,
    monthlyIncome: income,
    safetyBuffer: essential + profile.debtPayments,
  };
}

export interface ExperimentComparison {
  baseline: SimulationResult;
  adjusted: SimulationResult;
  adjustedProfile: FinancialProfile;
  deltaLowestBalance: number;
  deltaEndingBalance: number;
  deltaReserveDeficit: number;
  deltaMaxMonthlyGap: number;
  riskImproved: boolean;
}

export function runExperiment(
  profile: FinancialProfile,
  scenario: Scenario,
  adjustments: Adjustment[],
): ExperimentComparison {
  const baseline = simulate(profile, scenario);
  const adjustedProfile = applyAdjustments(profile, adjustments);
  const adjusted = simulate(adjustedProfile, scenario);
  const order = { Low: 0, Medium: 1, High: 2 } as const;
  return {
    baseline,
    adjusted,
    adjustedProfile,
    deltaLowestBalance: adjusted.lowestBalance - baseline.lowestBalance,
    deltaEndingBalance: adjusted.endingBalance - baseline.endingBalance,
    deltaReserveDeficit: adjusted.maxReserveDeficit - baseline.maxReserveDeficit,
    deltaMaxMonthlyGap: adjusted.maxMonthlyGap - baseline.maxMonthlyGap,
    riskImproved: order[adjusted.risk.level] < order[baseline.risk.level],
  };
}

export const adjustmentLabels: Record<AdjustmentKind, string> = {
  cutFlexible: "Reduce flexible spending",
  cutEssentials: "Reduce essential expenses",
  raiseIncome: "Increase monthly income",
};

export const adjustmentHints: Record<AdjustmentKind, string> = {
  cutFlexible: "Non-essential spending you could cut each month.",
  cutEssentials: "An amount you could shave off essentials each month.",
  raiseIncome: "Additional monthly income you could earn.",
};
