import { describe, expect, it } from "vitest";
import {
  adjustedIncome,
  compareScenarios,
  emergencyRunway,
  simulate,
} from "./financialCalculations";
import { buildPreset } from "./scenarioPresets";
import { formatVND, formatMonths } from "./formatCurrency";
import { validateScenario, parseAmount } from "./validation";
import type { FinancialProfile, Scenario } from "@/types/financial";

const profile: FinancialProfile = {
  openingBalance: 30_000_000,
  monthlyIncome: 20_000_000,
  essentialExpenses: 12_000_000,
  flexibleExpenses: 3_000_000,
  debtPayments: 2_000_000,
  safetyBuffer: 10_000_000,
};
const sc = (o: Partial<Scenario> = {}): Scenario => ({
  name: "t", horizon: 6, incomeReductionPct: 0, unexpectedExpenses: [], ...o,
});

describe("adjustedIncome", () => {
  it.each([[0, 20e6], [30, 14e6], [100, 0]])("reduction %i%%", (p, exp) => {
    expect(adjustedIncome(20e6, p)).toBeCloseTo(exp);
  });
  it("clamps out-of-range", () => {
    expect(adjustedIncome(10, 150)).toBe(0);
    expect(adjustedIncome(10, -5)).toBe(10);
  });
});

describe("simulate", () => {
  it("baseline projects running balance", () => {
    const r = simulate(profile, sc());
    expect(r.months).toHaveLength(6);
    expect(r.months[0]!.netCashFlow).toBe(3e6);
    expect(r.endingBalance).toBe(48e6);
    expect(r.lowestBalance).toBe(33e6);
    expect(r.maxMonthlyGap).toBe(0);
    expect(r.maxReserveDeficit).toBe(0);
    expect(r.risk.level).toBe("Low");
  });

  it.each([3, 6, 12] as const)("horizon %i", (h) => {
    expect(simulate(profile, sc({ horizon: h })).months).toHaveLength(h);
  });

  it("zero income -> negative and High risk", () => {
    const r = simulate(profile, sc({ incomeReductionPct: 100 }));
    // net -17M per month: 13, -4, ...
    expect(r.months[0]!.closingBalance).toBe(13e6);
    expect(r.firstNegativeMonth).toBe(2);
    expect(r.firstMonthBelowBuffer).toBe(2);
    expect(r.maxMonthlyGap).toBe(17e6);
    // MinBalance = 30M - 6*17M = -72M; reserve deficit = max(0, 72M)
    expect(r.maxReserveDeficit).toBe(72e6);
    expect(r.risk.level).toBe("High");
  });

  it("unexpected expense in a given month, combined shock", () => {
    const r = simulate(profile, sc({ incomeReductionPct: 50, unexpectedExpenses: [{ month: 3, amount: 5e6 }, { month: 3, amount: 1e6 }] }));
    expect(r.months[2]!.unexpected).toBe(6e6);
    expect(r.months[2]!.netCashFlow).toBe(10e6 - 17e6 - 6e6);
  });

  it("exact zero balance is not negative but below buffer", () => {
    const p = { ...profile, openingBalance: 17e6, monthlyIncome: 0, safetyBuffer: 0 };
    const r = simulate(p, sc({ horizon: 3 }));
    expect(r.months[0]!.closingBalance).toBe(0);
    expect(r.months[0]!.negative).toBe(false);
    expect(r.months[0]!.belowBuffer).toBe(false);
    expect(r.firstNegativeMonth).toBe(2);
  });

  it("blank flexible spending treated as zero", () => {
    const r = simulate({ ...profile, flexibleExpenses: null }, sc());
    expect(r.months[0]!.outflow).toBe(14e6);
  });

  it("medium risk when below buffer but never negative", () => {
    const p = { ...profile, openingBalance: 5e6 };
    const r = simulate(p, sc({ horizon: 3 }));
    expect(r.risk.level).toBe("Medium");
    expect(r.firstMonthBelowBuffer).toBe(1);
  });

  it("zero savings, zero debt", () => {
    const p = { ...profile, openingBalance: 0, debtPayments: 0 };
    const r = simulate(p, sc());
    expect(r.months[0]!.closingBalance).toBe(5e6);
    expect(r.minimumIncomeNeeded).toBe(12e6);
  });
});

describe("runway & minimum income", () => {
  it("runway under zero income", () => {
    expect(emergencyRunway(profile)).toBeCloseTo(30 / 14);
    expect(emergencyRunway({ ...profile, openingBalance: 0 })).toBe(0);
    expect(emergencyRunway({ ...profile, essentialExpenses: 0, debtPayments: 0 })).toBe(Infinity);
  });
});

describe("compareScenarios", () => {
  it("baseline and active are independent from same opening", () => {
    const c = compareScenarios(profile, sc({ incomeReductionPct: 100 }));
    expect(c.baseline.months[0]!.closingBalance).toBe(33e6);
    expect(c.active.months[0]!.closingBalance).toBe(13e6);
    expect(c.deltaEndingBalance).toBe(c.active.endingBalance - c.baseline.endingBalance);
  });
});

describe("format & validation", () => {
  it("formats VND with display rounding", () => {
    expect(formatVND(1234567.6)).toBe("1,234,568 ₫");
    expect(formatVND(-0.4)).toBe("0 ₫");
    expect(formatMonths(Infinity)).toBe("Unlimited");
  });
  it("validates scenario bounds", () => {
    expect(validateScenario(sc({ incomeReductionPct: 101 }))["incomeReductionPct"]).toBeDefined();
    expect(validateScenario(sc({ unexpectedExpenses: [{ month: 7, amount: 1 }] }))["unexpected.0.month"]).toBeDefined();
    expect(Object.keys(validateScenario(sc()))).toHaveLength(0);
  });
  it("parses amounts", () => {
    expect(parseAmount("1,500,000")).toBe(1_500_000);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNaN();
  });
});

describe("reserve deficit (spec: max(0, -MinBalance))", () => {
  it("zero when minimum balance is positive", () => {
    const r = simulate(profile, sc());
    expect(r.lowestBalance).toBe(33e6);
    expect(r.maxReserveDeficit).toBe(0);
  });
  it("equals the absolute value of a negative minimum balance", () => {
    const p = { ...profile, openingBalance: 10e6 };
    const r = simulate(p, sc({ incomeReductionPct: 100, horizon: 3 }));
    // balances: -7M, -24M, -41M → MinBalance = -41M → deficit = 41M
    expect(r.lowestBalance).toBe(-41e6);
    expect(r.maxReserveDeficit).toBe(41e6);
  });
  it("zero when minimum balance is exactly zero", () => {
    const p = { ...profile, openingBalance: 17e6, monthlyIncome: 0, safetyBuffer: 0 };
    const r = simulate(p, sc({ horizon: 1 as Scenario["horizon"] }));
    expect(r.lowestBalance).toBe(0);
    expect(r.maxReserveDeficit).toBe(0);
  });
});

describe("risk classification (spec rules)", () => {
  it("HIGH when any month-end balance is negative", () => {
    const r = simulate(profile, sc({ incomeReductionPct: 100 }));
    expect(r.risk.level).toBe("High");
  });
  it("MEDIUM when below buffer but never negative", () => {
    const p = { ...profile, openingBalance: 5e6 };
    const r = simulate(p, sc({ horizon: 3 }));
    expect(r.risk.level).toBe("Medium");
  });
  it("LOW when all balances at or above buffer, even with negative monthly cash flow", () => {
    // Large savings, but monthly outflow exceeds income — balance never drops below buffer
    const p: FinancialProfile = {
      openingBalance: 200e6,
      monthlyIncome: 5e6,
      essentialExpenses: 12e6,
      flexibleExpenses: 0,
      debtPayments: 2e6,
      safetyBuffer: 14e6,
    };
    const r = simulate(p, sc({ horizon: 6 }));
    // net = 5M - 14M = -9M each month; balances: 191, 182, 173, 164, 155, 146 — all above 14M
    expect(r.months.every((m) => m.netCashFlow < 0)).toBe(true);
    expect(r.months.every((m) => !m.belowBuffer)).toBe(true);
    expect(r.risk.level).toBe("Low");
  });
});

describe("Combined Shock preset", () => {
  const inputs = { normalIncome: 20e6, lowSeasonIncome: 14e6, essentialExpenses: 12e6 };
  it("uses 50% reduction for first 3 months", () => {
    for (const h of [3, 6, 12] as const) {
      const s = buildPreset("combined", h, inputs);
      expect(s.incomeReductionPct).toBe(50);
      expect(s.interruption).toEqual({ startMonth: 1, durationMonths: Math.min(3, h) });
    }
  });
  it("applies unexpected expense exactly once in month 1", () => {
    for (const h of [3, 6, 12] as const) {
      const s = buildPreset("combined", h, inputs);
      expect(s.unexpectedExpenses).toHaveLength(1);
      expect(s.unexpectedExpenses[0]!.month).toBe(1);
      expect(s.unexpectedExpenses[0]!.amount).toBe(12e6);
    }
  });
  it("respects 3-month horizon (reduction covers all 3 months)", () => {
    const s = buildPreset("combined", 3, inputs);
    expect(s.interruption!.durationMonths).toBe(3);
    const p: FinancialProfile = {
      openingBalance: 30e6, monthlyIncome: 20e6, essentialExpenses: 12e6,
      flexibleExpenses: 0, debtPayments: 2e6, safetyBuffer: 14e6,
    };
    const r = simulate(p, s);
    // months 1-3: income = 10M, outflow = 14M + 12M(exp m1) = 26M in m1, 14M in m2-3
    // m1: 30 + 10 - 26 = 14; m2: 14 + 10 - 14 = 10; m3: 10 + 10 - 14 = 6
    expect(r.months.map((m) => m.income)).toEqual([10e6, 10e6, 10e6]);
    expect(r.months[0]!.unexpected).toBe(12e6);
    expect(r.months[1]!.unexpected).toBe(0);
    expect(r.months[2]!.unexpected).toBe(0);
  });
  it("respects 6-month horizon (reduction only in months 1-3)", () => {
    const s = buildPreset("combined", 6, inputs);
    const p: FinancialProfile = {
      openingBalance: 30e6, monthlyIncome: 20e6, essentialExpenses: 12e6,
      flexibleExpenses: 0, debtPayments: 2e6, safetyBuffer: 14e6,
    };
    const r = simulate(p, s);
    expect(r.months.map((m) => m.income)).toEqual([10e6, 10e6, 10e6, 20e6, 20e6, 20e6]);
  });
  it("respects 12-month horizon (reduction only in months 1-3)", () => {
    const s = buildPreset("combined", 12, inputs);
    const p: FinancialProfile = {
      openingBalance: 30e6, monthlyIncome: 20e6, essentialExpenses: 12e6,
      flexibleExpenses: 0, debtPayments: 2e6, safetyBuffer: 14e6,
    };
    const r = simulate(p, s);
    expect(r.months).toHaveLength(12);
    expect(r.months.slice(0, 3).every((m) => m.income === 10e6)).toBe(true);
    expect(r.months.slice(3).every((m) => m.income === 20e6)).toBe(true);
  });
  it("does not use suggested low-season reduction", () => {
    const s = buildPreset("combined", 6, inputs);
    expect(s.incomeReductionPct).not.toBe(30);
    expect(s.incomeReductionPct).toBe(50);
  });
});
