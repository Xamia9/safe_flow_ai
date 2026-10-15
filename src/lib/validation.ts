import type { FinancialProfile, Scenario } from "@/types/financial";

export type Errors = Record<string, string>;

const nonNeg = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;

export const REQUIRED_FIELDS = [
  "monthlyIncome",
  "lowSeasonIncome",
  "essentialExpenses",
  "openingBalance",
  "debtPayments",
] as const;

/** Parse a user-typed VND amount. Blank -> null, invalid -> NaN.
 *  Accepts optional thousands separators (e.g. "1,500,000") but only in valid
 *  grouping positions — malformed input like "10,00,000" yields NaN rather than
 *  silently becoming a different amount. */
export function parseAmount(raw: string | undefined): number | null {
  const t = (raw ?? "").trim();
  if (t === "") return null;
  // If commas are present, validate thousands grouping before stripping.
  if (t.includes(",")) {
    const sign = t.startsWith("-") ? "-" : "";
    const body = sign ? t.slice(1) : t;
    if (!/^\d{1,3}(,\d{3})*$/.test(body)) return NaN;
  }
  const cleaned = t.replace(/[,\s₫]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export interface ParsedProfile {
  profile: FinancialProfile | null;
  errors: Errors;
  warnings: Errors;
}

/** Validate raw form strings and build a profile. Flexible spending and buffer may be blank. */
export function parseProfileDraft(d: Record<string, string>): ParsedProfile {
  const errors: Errors = {};
  const warnings: Errors = {};
  const v: Record<string, number> = {};
  for (const k of REQUIRED_FIELDS) {
    const n = parseAmount(d[k]);
    if (n === null) errors[k] = "This field is required.";
    else if (!nonNeg(n)) errors[k] = "Enter a number that is zero or greater.";
    else v[k] = n;
  }
  const flex = parseAmount(d["flexibleExpenses"]);
  if (flex !== null && !nonNeg(flex)) errors["flexibleExpenses"] = "Enter a number that is zero or greater, or leave blank.";

  if (v["lowSeasonIncome"] !== undefined && v["monthlyIncome"] !== undefined && v["lowSeasonIncome"] > v["monthlyIncome"])
    warnings["lowSeasonIncome"] = "Low-season income is higher than normal income. Please confirm this is correct.";

  if (Object.keys(errors).length) return { profile: null, errors, warnings };
  const essential = v["essentialExpenses"]!;
  const debt = v["debtPayments"]!;
  return {
    profile: {
      monthlyIncome: v["monthlyIncome"]!,
      lowSeasonIncome: v["lowSeasonIncome"]!,
      essentialExpenses: essential,
      debtPayments: debt,
      openingBalance: v["openingBalance"]!,
      flexibleExpenses: flex ?? 0,
      // Safety buffer is always B_min = E + D.
      safetyBuffer: essential + debt,
    },
    errors,
    warnings,
  };
}

export function validateProfile(p: FinancialProfile): Errors {
  const e: Errors = {};
  (["openingBalance", "monthlyIncome", "essentialExpenses", "debtPayments", "safetyBuffer"] as const).forEach((k) => {
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
  if (s.interruption) {
    const { startMonth, durationMonths } = s.interruption;
    if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > s.horizon)
      e["interruption.start"] = `Start month must be 1–${s.horizon}.`;
    if (!Number.isInteger(durationMonths) || durationMonths < 1)
      e["interruption.duration"] = "Duration must be at least 1 month.";
    else if (startMonth + durationMonths - 1 > s.horizon)
      e["interruption.duration"] = `Affected months must end by month ${s.horizon}.`;
  }
  s.unexpectedExpenses.forEach((x, i) => {
    if (!Number.isInteger(x.month) || x.month < 1 || x.month > s.horizon)
      e[`unexpected.${i}.month`] = `Month must be 1–${s.horizon}.`;
    if (!nonNeg(x.amount)) e[`unexpected.${i}.amount`] = "Must be zero or greater.";
  });
  return e;
}
