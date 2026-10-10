/**
 * Deterministic SafeFlow AI cash-flow engine.
 *
 * Definitions (to be reconciled with the master specification):
 * - adjusted income   = income × (1 − reduction% / 100)
 * - monthly outflow   = essential + flexible (blank = 0) + debt + unexpected[m]
 * - net cash flow     = adjusted income − outflow
 * - closing balance   = previous closing (month 0 = opening) + net
 * - lowest balance    = min of month-end balances
 * - max monthly gap   = max(0, max(−net))
 * - reserve deficit   = max(0, max(buffer − closing))
 * - below buffer      = closing < buffer;  negative = closing < 0 (exact 0 is not negative)
 * - runway (0 income) = opening / (essential + debt); ∞ when that sum is 0; 0 if opening ≤ 0
 * - minimum income    = essential + debt
 * Risk: High = any negative month; Medium = any month below buffer or any negative net flow;
 * Low otherwise. No probabilities or scores are produced. Full precision; round for display only.
 */
import type {
  FinancialProfile,
  MonthProjection,
  RiskAssessment,
  Scenario,
  ScenarioComparison,
  SimulationResult,
} from "@/types/financial";

const clampPct = (p: number) => Math.min(100, Math.max(0, p));

export function adjustedIncome(income: number, reductionPct: number): number {
  return income * (1 - clampPct(reductionPct) / 100);
}

export function fixedOutflow(p: FinancialProfile): number {
  return p.essentialExpenses + (p.flexibleExpenses ?? 0) + p.debtPayments;
}

export function minimumIncomeNeeded(p: FinancialProfile): number {
  return p.essentialExpenses + p.debtPayments;
}

export function emergencyRunway(p: FinancialProfile): number {
  const burn = p.essentialExpenses + p.debtPayments;
  if (p.openingBalance <= 0) return 0;
  if (burn <= 0) return Infinity;
  return p.openingBalance / burn;
}

export function projectMonths(p: FinancialProfile, s: Scenario): MonthProjection[] {
  const income = adjustedIncome(p.monthlyIncome, s.incomeReductionPct);
  const base = fixedOutflow(p);
  const out: MonthProjection[] = [];
  let balance = p.openingBalance;
  for (let m = 1; m <= s.horizon; m++) {
    const unexpected = s.unexpectedExpenses
      .filter((e) => e.month === m)
      .reduce((a, e) => a + e.amount, 0);
    const outflow = base + unexpected;
    const net = income - outflow;
    balance += net;
    out.push({
      month: m,
      income,
      outflow,
      unexpected,
      netCashFlow: net,
      closingBalance: balance,
      belowBuffer: balance < p.safetyBuffer,
      negative: balance < 0,
    });
  }
  return out;
}

export function classifyRisk(months: MonthProjection[]): RiskAssessment {
  const neg = months.find((m) => m.negative);
  if (neg) return { level: "High", reasons: [`Balance projected below zero in month ${neg.month}.`] };
  const reasons: string[] = [];
  const below = months.find((m) => m.belowBuffer);
  if (below) reasons.push(`Balance falls below your safety buffer in month ${below.month}.`);
  const deficit = months.find((m) => m.netCashFlow < 0);
  if (deficit) reasons.push(`Spending exceeds income in month ${deficit.month}.`);
  if (reasons.length) return { level: "Medium", reasons };
  return { level: "Low", reasons: ["Balance stays above your safety buffer with no monthly shortfall."] };
}

export function simulate(p: FinancialProfile, s: Scenario): SimulationResult {
  const months = projectMonths(p, s);
  const balances = months.map((m) => m.closingBalance);
  return {
    months,
    adjustedMonthlyIncome: adjustedIncome(p.monthlyIncome, s.incomeReductionPct),
    lowestBalance: Math.min(...balances),
    endingBalance: balances[balances.length - 1],
    maxMonthlyGap: Math.max(0, ...months.map((m) => -m.netCashFlow)),
    maxReserveDeficit: Math.max(0, ...balances.map((b) => p.safetyBuffer - b)),
    firstMonthBelowBuffer: months.find((m) => m.belowBuffer)?.month ?? null,
    firstNegativeMonth: months.find((m) => m.negative)?.month ?? null,
    runwayMonthsZeroIncome: emergencyRunway(p),
    minimumIncomeNeeded: minimumIncomeNeeded(p),
    risk: classifyRisk(months),
  };
}

export function compareScenarios(p: FinancialProfile, active: Scenario): ScenarioComparison {
  const baselineScenario: Scenario = {
    name: "Baseline",
    horizon: active.horizon,
    incomeReductionPct: 0,
    unexpectedExpenses: [],
  };
  const baseline = simulate(p, baselineScenario);
  const act = simulate(p, active);
  return {
    baseline,
    active: act,
    deltaEndingBalance: act.endingBalance - baseline.endingBalance,
    deltaLowestBalance: act.lowestBalance - baseline.lowestBalance,
  };
}
