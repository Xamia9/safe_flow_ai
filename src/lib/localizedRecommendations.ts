/**
 * Localized recommendation builder.
 *
 * Reuses the deterministic selection logic in recommendations.ts (which
 * solution categories qualify, their priority, experiment support) and
 * rebuilds the user-facing text fields in the selected language.
 *
 * Numeric values and currency amounts are never translated; only the
 * surrounding sentences are localized.
 */
import type { FinancialProfile, Scenario, SimulationResult } from "@/types/financial";
import {
  selectRecommendations,
  type Recommendation,
  type RecPriority,
} from "./recommendations";
import type { TranslationKey } from "@/i18n/translations";
import type { TranslateFn as T } from "@/i18n/LanguageContext";
import { formatAmount } from "./formatCurrencyLocalized";

interface BuildInput {
  profile: FinancialProfile;
  scenario: Scenario;
  result: SimulationResult;
}

/**
 * Return recommendations with localized text fields, preserving the same
 * solution IDs, priorities, action-step counts, experiment support and
 * adjustment amounts as the deterministic engine.
 */
export function localizedRecommendations(input: BuildInput, t: T): Recommendation[] {
  const base = selectRecommendations(input);
  return base.map((rec) => localizeRec(rec, input, t));
}

function localizeRec(rec: Recommendation, input: BuildInput, t: T): Recommendation {
  switch (rec.solutionId) {
    case "budget_optimization":
      return localizeBudget(rec, input, t);
    case "income_stability":
      return localizeIncome(rec, input, t);
    case "emergency_reserve":
      return localizeReserve(rec, input, t);
    case "debt_payment_preparation":
      return localizeDebt(rec, input, t);
    case "major_expense_planning":
      return localizeMajor(rec, input, t);
    case "financial_support_advice":
      return localizeSupport(rec, input, t);
    default:
      return rec;
  }
}

function withCommon(rec: Recommendation, t: T, titleKey: TranslationKey, impactKey: TranslationKey): Partial<Recommendation> {
  return {
    title: t(titleKey),
    expectedImpact: t(impactKey),
    priority: rec.priority,
  };
}

function localizeBudget(rec: Recommendation, input: BuildInput, t: T): Recommendation {
  const { result, profile } = input;
  const flex = profile.flexibleExpenses ?? 0;
  const triggerReasons: string[] = [];
  if (result.maxMonthlyGap > 0) {
    triggerReasons.push(t("rec.budget.reasonGap", { amount: formatAmount(result.maxMonthlyGap) }));
  } else {
    triggerReasons.push(t("rec.budget.reasonNegative"));
  }
  triggerReasons.push(t("rec.budget.reasonFlex", { amount: formatAmount(flex) }));
  return {
    ...rec,
    ...withCommon(rec, t, "rec.budget.title", "rec.budget.impact"),
    triggerReasons,
    actionSteps: [
      { text: t("rec.budget.step1") },
      { text: t("rec.budget.step2") },
      { text: t("rec.budget.step3") },
    ],
    limitations: [t("rec.budget.lim1"), t("rec.budget.lim2")],
  };
}

function localizeIncome(rec: Recommendation, input: BuildInput, t: T): Recommendation {
  const { profile, scenario } = input;
  const triggerReasons: string[] = [];
  const hasSeasonal = profile.lowSeasonIncome !== undefined && profile.lowSeasonIncome < profile.monthlyIncome;
  if (hasSeasonal) {
    triggerReasons.push(
      t("rec.income.reasonSeasonal", {
        low: formatAmount(profile.lowSeasonIncome!),
        normal: formatAmount(profile.monthlyIncome),
      }),
    );
  }
  if (scenario.kind === "interruption" || scenario.incomeReductionPct >= 100) {
    triggerReasons.push(t("rec.income.reasonInterruption"));
  } else if (scenario.incomeReductionPct > 0) {
    triggerReasons.push(t("rec.income.reasonReduction", { pct: scenario.incomeReductionPct }));
  }
  return {
    ...rec,
    ...withCommon(rec, t, "rec.income.title", "rec.income.impact"),
    triggerReasons,
    actionSteps: [
      { text: t("rec.income.step1") },
      { text: t("rec.income.step2") },
      { text: t("rec.income.step3") },
    ],
    limitations: [t("rec.income.lim1"), t("rec.income.lim2")],
  };
}

function localizeReserve(rec: Recommendation, input: BuildInput, t: T): Recommendation {
  const { profile, result } = input;
  const buffer = profile.safetyBuffer;
  const openingBelow = profile.openingBalance < buffer;
  const triggerReasons: string[] = [];
  if (openingBelow) {
    triggerReasons.push(
      t("rec.reserve.reasonOpening", {
        opening: formatAmount(profile.openingBalance),
        buffer: formatAmount(buffer),
      }),
    );
  }
  if (result.firstMonthBelowBuffer !== null) {
    triggerReasons.push(t("rec.reserve.reasonBelow", { n: result.firstMonthBelowBuffer }));
  }
  return {
    ...rec,
    ...withCommon(rec, t, "rec.reserve.title", "rec.reserve.impact"),
    triggerReasons,
    actionSteps: [
      { text: t("rec.reserve.step1", { buffer: formatAmount(buffer) }) },
      { text: t("rec.reserve.step2") },
      { text: t("rec.reserve.step3") },
    ],
    limitations: [t("rec.reserve.lim1"), t("rec.reserve.lim2"), t("rec.reserve.lim3")],
    missingInformation: [t("rec.reserve.missing")],
  };
}

function localizeDebt(rec: Recommendation, input: BuildInput, t: T): Recommendation {
  const { profile, result } = input;
  const triggerReasons: string[] = [
    t("rec.debt.reasonPayments", { amount: formatAmount(profile.debtPayments) }),
  ];
  if (result.firstNegativeMonth !== null) {
    triggerReasons.push(t("rec.debt.reasonNegative", { n: result.firstNegativeMonth }));
  } else if (result.firstMonthBelowBuffer !== null) {
    triggerReasons.push(t("rec.debt.reasonBuffer", { n: result.firstMonthBelowBuffer }));
  } else {
    triggerReasons.push(t("rec.debt.reasonPressure"));
  }
  return {
    ...rec,
    ...withCommon(rec, t, "rec.debt.title", "rec.debt.impact"),
    triggerReasons,
    actionSteps: [
      { text: t("rec.debt.step1") },
      { text: t("rec.debt.step2") },
      { text: t("rec.debt.step3") },
    ],
    limitations: [t("rec.debt.lim1"), t("rec.debt.lim2"), t("rec.debt.lim3"), t("rec.debt.lim4")],
    missingInformation: [t("rec.debt.missing1"), t("rec.debt.missing2")],
  };
}

function localizeMajor(rec: Recommendation, input: BuildInput, t: T): Recommendation {
  const { scenario } = input;
  const expenses = scenario.unexpectedExpenses.filter((e) => e.amount > 0);
  const triggerReasons = expenses.map((e) =>
    t("rec.major.reasonExpense", { amount: formatAmount(e.amount), n: e.month }),
  );
  return {
    ...rec,
    ...withCommon(rec, t, "rec.major.title", "rec.major.impact"),
    triggerReasons,
    actionSteps: [
      { text: t("rec.major.step1") },
      { text: t("rec.major.step2") },
      { text: t("rec.major.step3") },
    ],
    limitations: [t("rec.major.lim1"), t("rec.major.lim2")],
  };
}

function localizeSupport(rec: Recommendation, input: BuildInput, t: T): Recommendation {
  const { result } = input;
  const triggerReasons: string[] = [];
  if (result.firstNegativeMonth !== null) {
    triggerReasons.push(t("rec.support.reasonNegative", { n: result.firstNegativeMonth }));
  } else {
    triggerReasons.push(t("rec.support.reasonDeficit", { amount: formatAmount(result.maxReserveDeficit) }));
  }
  return {
    ...rec,
    ...withCommon(rec, t, "rec.support.title", "rec.support.impact"),
    triggerReasons,
    actionSteps: [
      { text: t("rec.support.step1") },
      { text: t("rec.support.step2") },
      { text: t("rec.support.step3") },
    ],
    limitations: [t("rec.support.lim1"), t("rec.support.lim2"), t("rec.support.lim3")],
    missingInformation: [t("rec.support.missing1"), t("rec.support.missing2")],
  };
}

/** Localized priority label wrapper, kept here for parity with the rec module. */
export function localizedPriorityLabel(priority: RecPriority, t: T): string {
  const key: TranslationKey =
    priority === "High" ? "priority.high" : priority === "Medium" ? "priority.medium" : "priority.preventive";
  return t(key);
}
