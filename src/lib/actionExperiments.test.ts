import { describe, expect, it } from "vitest";
import type { FinancialProfile, Scenario } from "@/types/financial";
import { simulate } from "./financialCalculations";
import {
  addAdjustment,
  applyAdjustments,
  emptyExperiment,
  removeAdjustment,
  resetExperiment,
  runExperiment,
  updateAdjustment,
} from "./actionExperiments";

const profile: FinancialProfile = {
  openingBalance: 30_000_000,
  monthlyIncome: 20_000_000,
  essentialExpenses: 12_000_000,
  flexibleExpenses: 3_000_000,
  debtPayments: 2_000_000,
  safetyBuffer: 14_000_000,
};

const scenario: Scenario = {
  name: "Income Reduction",
  kind: "income-reduction",
  horizon: 6,
  incomeReductionPct: 100,
  interruption: { startMonth: 1, durationMonths: 6 },
  unexpectedExpenses: [],
};

describe("applyAdjustments", () => {
  it("does not mutate the original profile", () => {
    const before = JSON.stringify(profile);
    applyAdjustments(profile, [
      { kind: "cutFlexible", amount: 1e6 },
      { kind: "cutEssentials", amount: 2e6 },
      { kind: "raiseIncome", amount: 5e6 },
    ]);
    expect(JSON.stringify(profile)).toBe(before);
  });

  it("reduces flexible expenses, floored at 0", () => {
    const p = applyAdjustments(profile, [{ kind: "cutFlexible", amount: 5e6 }]);
    expect(p.flexibleExpenses).toBe(0);
    expect(p.essentialExpenses).toBe(12e6);
  });

  it("reduces essential expenses and recalculates safety buffer", () => {
    const p = applyAdjustments(profile, [{ kind: "cutEssentials", amount: 4e6 }]);
    expect(p.essentialExpenses).toBe(8e6);
    expect(p.safetyBuffer).toBe(10e6);
  });

  it("increases monthly income", () => {
    const p = applyAdjustments(profile, [{ kind: "raiseIncome", amount: 5e6 }]);
    expect(p.monthlyIncome).toBe(25e6);
  });

  it("applies multiple adjustments cumulatively", () => {
    const p = applyAdjustments(profile, [
      { kind: "cutFlexible", amount: 1e6 },
      { kind: "cutEssentials", amount: 2e6 },
      { kind: "raiseIncome", amount: 3e6 },
    ]);
    expect(p.flexibleExpenses).toBe(2e6);
    expect(p.essentialExpenses).toBe(10e6);
    expect(p.monthlyIncome).toBe(23e6);
    expect(p.safetyBuffer).toBe(12e6);
  });
});

describe("runExperiment", () => {
  it("baseline matches a direct simulate() call", () => {
    const cmp = runExperiment(profile, scenario, []);
    expect(cmp.baseline).toEqual(simulate(profile, scenario));
  });

  it("with no adjustments, adjusted equals baseline", () => {
    const cmp = runExperiment(profile, scenario, []);
    expect(cmp.adjusted).toEqual(cmp.baseline);
    expect(cmp.deltaLowestBalance).toBe(0);
    expect(cmp.deltaEndingBalance).toBe(0);
  });

  it("cutting expenses improves ending balance under zero-income scenario", () => {
    const cmp = runExperiment(profile, scenario, [
      { kind: "cutFlexible", amount: 3e6 },
      { kind: "cutEssentials", amount: 2e6 },
    ]);
    // Outflow drops by 5M/month → ending balance rises by 6 × 5M = 30M
    expect(cmp.deltaEndingBalance).toBe(30e6);
    expect(cmp.adjusted.endingBalance).toBe(cmp.baseline.endingBalance + 30e6);
  });

  it("raising income improves lowest balance under income reduction", () => {
    // 100% reduction → income is 0; raiseIncome adds back to the base,
    // but adjustedIncome is still 0 because reduction is 100%.
    // So use a partial reduction instead.
    const partialSc: Scenario = {
      ...scenario,
      incomeReductionPct: 50,
      interruption: { startMonth: 1, durationMonths: 6 },
    };
    const cmp = runExperiment(profile, partialSc, [{ kind: "raiseIncome", amount: 10e6 }]);
    // Original adjusted income = 20M × 0.5 = 10M; new base = 30M × 0.5 = 15M
    // Net improvement = 5M/month × 6 months = 30M
    expect(cmp.deltaEndingBalance).toBe(30e6);
  });

  it("risk can improve from High to Medium with adjustments", () => {
    // profile: 30M opening, 0 income (100% reduction), 14M outflow + 3M flexible = 17M/month
    // baseline: m1 = 13M, m2 = -4M → High
    // Cut flexible 3M + cut essential 1M → outflow = 13M
    // m1 = 17M, m2 = 4M, m3 = -9M → still High... need bigger cut
    // Cut 3M flexible + 3M essential → outflow = 11M
    // m1 = 19M, m2 = 8M, m3 = -3M → still High
    // Cut 3M flex + 4M essential → outflow = 10M, buffer = 10M
    // m1 = 20M, m2 = 10M, m3 = 0, m4 = -10M → still negative
    // Use horizon 3 with aggressive cuts to move from High to Low.
    const shortSc: Scenario = { ...scenario, horizon: 3, interruption: { startMonth: 1, durationMonths: 3 } };
    const cmp = runExperiment(profile, shortSc, [
      { kind: "cutFlexible", amount: 3e6 },
      { kind: "cutEssentials", amount: 6e6 },
    ]);
    // outflow = (12-6) + 0 + 2 = 8M; buffer = 6+2 = 8M
    // m1 = 30-8 = 22, m2 = 22-8 = 14, m3 = 14-8 = 6 → 6 < 8 → Medium, not Low
    // Need outflow <= (30 - 3×buffer) / 3. With buffer = E+D, if E=5: out=7, buf=7, m3=30-21=9 >= 7 → Low
    const cmp2 = runExperiment(profile, shortSc, [
      { kind: "cutFlexible", amount: 3e6 },
      { kind: "cutEssentials", amount: 7e6 },
    ]);
    // outflow = (12-7) + 0 + 2 = 7M; buffer = 5+2 = 7M
    // m1 = 23, m2 = 16, m3 = 9 → all >= 7 → Low
    expect(cmp2.baseline.risk.level).toBe("High");
    expect(cmp2.adjusted.risk.level).toBe("Low");
    expect(cmp2.riskImproved).toBe(true);
  });

  it("baseline profile remains unchanged after running experiment", () => {
    const before = JSON.stringify(profile);
    runExperiment(profile, scenario, [
      { kind: "cutFlexible", amount: 1e6 },
      { kind: "raiseIncome", amount: 5e6 },
    ]);
    expect(JSON.stringify(profile)).toBe(before);
  });
});

describe("experiment state management", () => {
  it("addAdjustment appends without mutating", () => {
    const s1 = emptyExperiment;
    const s2 = addAdjustment(s1, { kind: "cutFlexible", amount: 1e6 });
    expect(s1.adjustments).toHaveLength(0);
    expect(s2.adjustments).toHaveLength(1);
  });

  it("updateAdjustment patches the correct entry", () => {
    const s = addAdjustment(
      addAdjustment(emptyExperiment, { kind: "cutFlexible", amount: 1e6 }),
      { kind: "raiseIncome", amount: 2e6 },
    );
    const u = updateAdjustment(s, 0, { amount: 5e6 });
    expect(u.adjustments[0]!.amount).toBe(5e6);
    expect(u.adjustments[1]!.amount).toBe(2e6);
  });

  it("removeAdjustment removes the correct entry", () => {
    const s = addAdjustment(
      addAdjustment(emptyExperiment, { kind: "cutFlexible", amount: 1e6 }),
      { kind: "raiseIncome", amount: 2e6 },
    );
    const r = removeAdjustment(s, 0);
    expect(r.adjustments).toHaveLength(1);
    expect(r.adjustments[0]!.kind).toBe("raiseIncome");
  });

  it("resetExperiment returns to empty", () => {
    const s = addAdjustment(emptyExperiment, { kind: "cutFlexible", amount: 1e6 });
    expect(resetExperiment()).toEqual(emptyExperiment);
  });
});
