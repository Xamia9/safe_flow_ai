import { describe, expect, it } from "vitest";
import type { FinancialProfile, Scenario } from "@/types/financial";
import { simulate } from "./financialCalculations";
import { selectRecommendations, getRecommendations } from "./recommendations";

const baseProfile: FinancialProfile = {
  openingBalance: 50_000_000,
  monthlyIncome: 20_000_000,
  lowSeasonIncome: 14_000_000,
  essentialExpenses: 12_000_000,
  flexibleExpenses: 3_000_000,
  debtPayments: 2_000_000,
  safetyBuffer: 14_000_000,
};

const baseScenario: Scenario = {
  name: "Baseline",
  kind: "baseline",
  horizon: 6,
  incomeReductionPct: 0,
  interruption: null,
  unexpectedExpenses: [],
};

function recs(profile: FinancialProfile, scenario: Scenario) {
  const result = simulate(profile, scenario);
  return selectRecommendations({ profile, scenario, result });
}

function ids(recs: { solutionId: string }[]): string[] {
  return recs.map((r) => r.solutionId);
}

describe("recommendation selection", () => {
  // 1. Stable baseline with no unnecessary recommendations
  it("baseline with healthy finances returns only income_stability (seasonal variation)", () => {
    // opening 50M, income 20M, outflow 17M -> net +3M/month, never below buffer
    // But low-season < normal -> income_stability triggers
    const r = recs(baseProfile, baseScenario);
    const idList = ids(r);
    // No budget_optimization (no cash-flow pressure), no emergency_reserve (no breach),
    // no debt (no pressure), no major expense, no support, no optional services
    expect(idList).not.toContain("budget_optimization");
    expect(idList).not.toContain("emergency_reserve");
    expect(idList).not.toContain("debt_payment_preparation");
    expect(idList).not.toContain("major_expense_planning");
    expect(idList).not.toContain("financial_support_advice");
    expect(idList).not.toContain("optional_financial_services");
    // income_stability should be present due to seasonal variation
    expect(idList).toContain("income_stability");
  });

  // 2. Negative projected balance
  it("negative projected balance triggers High priority recommendations", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      openingBalance: 15_000_000,
      lowSeasonIncome: 20_000_000,
      flexibleExpenses: 0,
      debtPayments: 0,
      safetyBuffer: 12_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "income-reduction",
      incomeReductionPct: 100,
      interruption: { startMonth: 1, durationMonths: 6 },
    };
    // income 0, outflow 12M -> net -12M; M1=3M (below buffer), M2=-9M (negative)
    const r = recs(p, s);
    expect(r.every((x) => x.priority === "High")).toBe(true);
    expect(ids(r)).toContain("income_stability");
    expect(ids(r)).toContain("emergency_reserve");
    expect(ids(r)).toContain("financial_support_advice");
  });

  // 3. Buffer breach without negative balance
  it("buffer breach without negative balance triggers Medium priority", () => {
    // opening 16M, 40% reduction for 3 months: income 12M, outflow 14M, net -2M
    // M1=14 (>= buffer 14M), M2=12 (< 14M), M3=10 (< 14M), M4=16, M5=22, M6=28
    // Never negative, below buffer in month 2 -> Medium
    const p3: FinancialProfile = {
      ...baseProfile,
      openingBalance: 16_000_000,
      lowSeasonIncome: 20_000_000,
      flexibleExpenses: 0,
    };
    const s3: Scenario = {
      ...baseScenario,
      kind: "income-reduction",
      incomeReductionPct: 40,
      interruption: { startMonth: 1, durationMonths: 3 },
    };
    const result3 = simulate(p3, s3);
    expect(result3.firstNegativeMonth).toBeNull();
    expect(result3.firstMonthBelowBuffer).not.toBeNull();
    const r3 = recs(p3, s3);
    expect(r3.every((x) => x.priority === "Medium")).toBe(true);
  });

  // 4. Seasonal income variation
  it("seasonal income variation triggers income_stability", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      lowSeasonIncome: 10_000_000,
      openingBalance: 100_000_000,
    };
    const r = recs(p, baseScenario);
    expect(ids(r)).toContain("income_stability");
  });

  // 5. Income-interruption scenario
  it("income interruption triggers income_stability", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      lowSeasonIncome: 20_000_000, // no seasonal variation
      openingBalance: 100_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "interruption",
      incomeReductionPct: 100,
      interruption: { startMonth: 2, durationMonths: 1 },
    };
    const r = recs(p, s);
    expect(ids(r)).toContain("income_stability");
  });

  // 6. Mandatory debt payments with projected cash-flow pressure
  it("debt payments with cash-flow pressure triggers debt_payment_preparation", () => {
    // Use an unexpected-expense scenario (not income-reduction) so income_stability
    // doesn't consume a slot. flex=0 removes budget_optimization.
    // opening 12M, buffer 15M, expense 5M in m1: outflow m1=20M, net=0
    // M1=12 (< buffer 15M), M2=17, M3=22... below buffer but never negative
    const p: FinancialProfile = {
      ...baseProfile,
      lowSeasonIncome: 20_000_000,
      debtPayments: 3_000_000,
      flexibleExpenses: 0,
      openingBalance: 12_000_000,
      safetyBuffer: 15_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "unexpected-expense",
      unexpectedExpenses: [{ month: 1, amount: 5_000_000 }],
    };
    const r = recs(p, s);
    expect(ids(r)).toContain("debt_payment_preparation");
  });

  // 7. Scenario containing an unexpected expense
  it("unexpected expense triggers major_expense_planning", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      lowSeasonIncome: 20_000_000,
      openingBalance: 100_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "unexpected-expense",
      unexpectedExpenses: [{ month: 3, amount: 10_000_000 }],
    };
    const r = recs(p, s);
    expect(ids(r)).toContain("major_expense_planning");
  });

  // 8. Zero flexible expenses
  it("zero flexible expenses does not trigger budget_optimization", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      lowSeasonIncome: 20_000_000,
      flexibleExpenses: 0,
      openingBalance: 10_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "income-reduction",
      incomeReductionPct: 100,
      interruption: { startMonth: 1, durationMonths: 6 },
    };
    const r = recs(p, s);
    expect(ids(r)).not.toContain("budget_optimization");
  });

  // 9. Missing or insufficient data for a service recommendation
  it("optional_financial_services is never recommended without explicit goal data", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      openingBalance: 5_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "income-reduction",
      incomeReductionPct: 100,
      interruption: { startMonth: 1, durationMonths: 6 },
    };
    const r = recs(p, s);
    expect(ids(r)).not.toContain("optional_financial_services");
  });

  // 10. Overlapping triggers must not produce duplicate solutions
  it("overlapping triggers produce no duplicate solution IDs", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      openingBalance: 10_000_000,
      debtPayments: 3_000_000,
      flexibleExpenses: 3_000_000,
      safetyBuffer: 15_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "combined",
      incomeReductionPct: 50,
      interruption: { startMonth: 1, durationMonths: 3 },
      unexpectedExpenses: [{ month: 2, amount: 8_000_000 }],
    };
    const r = recs(p, s);
    const idList = ids(r);
    expect(idList.length).toBe(new Set(idList).size); // no duplicates
    expect(r.length).toBeLessThanOrEqual(3);
  });

  // 11. A case in which only one or two recommendations qualify
  it("only income_stability qualifies for healthy finances with seasonal variation", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      openingBalance: 100_000_000,
      lowSeasonIncome: 15_000_000,
      debtPayments: 0,
      flexibleExpenses: 0,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "baseline",
    };
    const r = recs(p, s);
    expect(r.length).toBeLessThanOrEqual(2);
    expect(ids(r)).toContain("income_stability");
  });

  // 12. A case in which no recommendation qualifies
  it("no recommendation qualifies for stable finances with no variation", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      openingBalance: 100_000_000,
      lowSeasonIncome: 20_000_000, // same as normal
      debtPayments: 0,
      flexibleExpenses: 0,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "baseline",
    };
    const r = recs(p, s);
    expect(r).toHaveLength(0);
  });

  // 13. Preserving baseline data when a user runs an experiment
  it("getRecommendations does not mutate profile or scenario", () => {
    const p: FinancialProfile = { ...baseProfile };
    const s: Scenario = { ...baseScenario, unexpectedExpenses: [{ month: 1, amount: 5_000_000 }] };
    const pBefore = JSON.stringify(p);
    const sBefore = JSON.stringify(s);
    getRecommendations(p, s);
    expect(JSON.stringify(p)).toBe(pBefore);
    expect(JSON.stringify(s)).toBe(sBefore);
  });

  // 14. Numerical impact status when an action is not supported by the experiment engine
  it("emergency_reserve has impactStatus not_quantified and experimentSupported false", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      openingBalance: 10_000_000,
      lowSeasonIncome: 20_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "income-reduction",
      incomeReductionPct: 30,
      interruption: { startMonth: 1, durationMonths: 3 },
    };
    const r = recs(p, s);
    const reserve = r.find((x) => x.solutionId === "emergency_reserve");
    expect(reserve).toBeDefined();
    expect(reserve!.impactStatus).toBe("not_quantified");
    expect(reserve!.experimentSupported).toBe(false);
  });

  // Additional: budget_optimization should have quantified impact
  it("budget_optimization has impactStatus quantified and experimentSupported true", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      openingBalance: 10_000_000,
      lowSeasonIncome: 20_000_000,
      flexibleExpenses: 3_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "income-reduction",
      incomeReductionPct: 100,
      interruption: { startMonth: 1, durationMonths: 6 },
    };
    const r = recs(p, s);
    const budget = r.find((x) => x.solutionId === "budget_optimization");
    expect(budget).toBeDefined();
    expect(budget!.impactStatus).toBe("quantified");
    expect(budget!.experimentSupported).toBe(true);
    expect(budget!.experimentAdjustments).toBeDefined();
    expect(budget!.experimentAdjustments!.length).toBeGreaterThan(0);
  });

  // Additional: results are never more than 3
  it("never returns more than 3 recommendations", () => {
    const p: FinancialProfile = {
      ...baseProfile,
      openingBalance: 10_000_000,
      debtPayments: 3_000_000,
      flexibleExpenses: 3_000_000,
      safetyBuffer: 15_000_000,
      lowSeasonIncome: 10_000_000,
    };
    const s: Scenario = {
      ...baseScenario,
      kind: "combined",
      incomeReductionPct: 50,
      interruption: { startMonth: 1, durationMonths: 3 },
      unexpectedExpenses: [{ month: 2, amount: 8_000_000 }],
    };
    const r = recs(p, s);
    expect(r.length).toBeLessThanOrEqual(3);
  });
});
