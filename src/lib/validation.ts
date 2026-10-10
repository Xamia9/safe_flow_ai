import type { FinancialProfile, Scenario } from "@/types/financial";

export type Errors = Record<string, string>;

const nonNeg = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;

export function validateProfile(p: FinancialProfile): Errors {
  const e: Errors = {};
  if (!Number.isFinite(p.openingBalance)) e["openingBalance"] = "Enter a valid amount.";
  (["monthlyIncome", "essentialExpenses", "debtPayments", "safetyBuffer"] as const).forEach((k) => {
    if (!nonNeg(p[k])) e[k] = "Must be zero or greater.";
  });
  if (p.flexibleExpenses != null && !nonNeg(p.flexibleExpenses))
    e["flexibleExpenses"] = "Must be zero or greater, or left blank.";
  return e;
}

export function validateScenario(s: Scenario): Errors {
  const e: Errors = {};
  if (![3, 6, 12].includes(s.horizon)) e["horizon"] = "Choose 3, 6 or 12 months.";
  if (!(s.incomeReductionPct >= 0 && s.incomeReductionPct <= 100))
    e["incomeReductionPct"] = "Must be between 0% and 100%.";
  s.unexpectedExpenses.forEach((x, i) => {
    if (!Number.isInteger(x.month) || x.month < 1 || x.month > s.horizon)
      e[`unexpected.${i}.month`] = `Month must be 1–${s.horizon}.`;
    if (!nonNeg(x.amount)) e[`unexpected.${i}.amount`] = "Must be zero or greater.";
  });
  return e;
}

/** Parse a user-typed VND amount ("1,500,000"). Blank -> null. */
export function parseAmount(raw: string): number | null {
  const t = raw.replace(/[,\s₫]/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}
