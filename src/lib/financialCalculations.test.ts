import { describe, expect, it } from "vitest";
import {
  adjustedIncome,
  compareScenarios,
  emergencyRunway,
  simulate,
} from "./financialCalculations";
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
    expect(r.maxReserveDeficit).toBe(10e6 - (30e6 - 6 * 17e6));
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
