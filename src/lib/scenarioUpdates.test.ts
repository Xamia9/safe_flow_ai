import { describe, expect, it } from "vitest";
import { compareScenarios, simulate } from "./financialCalculations";
import { buildPreset, suggestedReduction } from "./scenarioPresets";
import { describeScenario, resetScenario, setDuration, setExpense, setHorizon, setReductionPct } from "./scenarioUpdates";
import { parseProfileDraft, validateScenario } from "./validation";
import type { FinancialProfile } from "@/types/financial";

const p: FinancialProfile = {
  openingBalance: 30e6, monthlyIncome: 20e6, lowSeasonIncome: 14e6,
  essentialExpenses: 12e6, flexibleExpenses: 3e6, debtPayments: 2e6, safetyBuffer: 14e6,
};
const inputs = { normalIncome: 20e6, lowSeasonIncome: 14e6, essentialExpenses: 12e6 };

describe("presets", () => {
  it("interruption = 100% for 1 month from month 1", () => {
    const s = buildPreset("interruption", 6, inputs);
    expect(s.incomeReductionPct).toBe(100);
    expect(s.interruption).toEqual({ startMonth: 1, durationMonths: 1 });
    const r = simulate(p, s);
    expect(r.months[0]!.income).toBe(0);
    expect(r.months[1]!.income).toBe(20e6);
  });
  it("no valid estimate -> neutral 0%, not derived", () => {
    expect(suggestedReduction({ ...inputs, lowSeasonIncome: 25e6 })).toEqual({ pct: 0, derived: false });
    expect(suggestedReduction({ ...inputs, normalIncome: 0 })).toEqual({ pct: 0, derived: false });
    expect(buildPreset("income-reduction", 6, { ...inputs, normalIncome: 0 }).incomeReductionPct).toBe(0);
  });
  it("derived reduction from low-season income", () => {
    expect(buildPreset("income-reduction", 6, inputs).incomeReductionPct).toBe(30);
  });
  it("safety buffer is always E + D", () => {
    const r = parseProfileDraft({ monthlyIncome: "20,000,000", lowSeasonIncome: "1", essentialExpenses: "12000000", openingBalance: "0", debtPayments: "2000000", safetyBuffer: "999" });
    expect(r.profile!.safetyBuffer).toBe(14e6);
  });
});

describe("dashboard updates", () => {
  const base = buildPreset("combined", 6, inputs);
  it("clamps reduction to integer 0..100", () => {
    expect(setReductionPct(base, 150).incomeReductionPct).toBe(100);
    expect(setReductionPct(base, 12.6).incomeReductionPct).toBe(13);
  });
  it("duration limited to horizon and applied only in window", () => {
    const s = setDuration(setReductionPct(base, 50), 2);
    const r = simulate(p, { ...s, unexpectedExpenses: [] });
    expect(r.months.map((m) => m.income)).toEqual([10e6, 10e6, 20e6, 20e6, 20e6, 20e6]);
    expect(setDuration(base, 99).interruption!.durationMonths).toBe(6);
  });
  it("expense deducted exactly once in chosen month", () => {
    const s = setExpense(base, { amount: 5e6, month: 4 });
    const r = simulate(p, s);
    expect(r.months.map((m) => m.unexpected)).toEqual([0, 0, 0, 5e6, 0, 0]);
    expect(setExpense(base, { month: 40 }).unexpectedExpenses[0]!.month).toBe(6);
  });
  it("does not mutate input or baseline", () => {
    const before = JSON.stringify(base);
    const c1 = compareScenarios(p, base);
    const c2 = compareScenarios(p, setReductionPct(base, 100));
    expect(JSON.stringify(base)).toBe(before);
    expect(c2.baseline).toEqual(c1.baseline);
  });
  it("reset restores preset, horizon kept", () => {
    const edited = setExpense(setReductionPct(setHorizon(base, 12), 90), { amount: 1 });
    const r = resetScenario(edited, p);
    expect(r).toEqual(buildPreset("combined", 12, inputs));
  });
  it("horizon shrink keeps window and expenses valid", () => {
    const s = setHorizon(setExpense(buildPreset("combined", 12, inputs), { month: 10 }), 3);
    expect(s.unexpectedExpenses).toHaveLength(0);
    expect(s.interruption).toEqual({ startMonth: 1, durationMonths: 3 });
    expect(Object.keys(validateScenario(s))).toHaveLength(0);
  });
  it("lowest balance month and summary", () => {
    const r = simulate(p, buildPreset("interruption", 6, inputs));
    expect(r.lowestBalanceMonth).toBe(1);
    expect(describeScenario(buildPreset("interruption", 6, inputs))).toMatchObject({ reductionPct: 100, affectedMonths: "Month 1", expense: null });
  });
});
