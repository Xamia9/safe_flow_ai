export type Horizon = 3 | 6 | 12;

export interface FinancialProfile {
  /** Cash available at the start of month 1 (VND). */
  openingBalance: number;
  /** Normal monthly net income before scenario adjustment (VND). */
  monthlyIncome: number;
  /** Typical monthly net income during the low season (VND). Used to suggest a reduction. */
  lowSeasonIncome?: number;
  /** Essential monthly expenses: housing, food, utilities, transport (VND). */
  essentialExpenses: number;
  /** Optional discretionary spending. Blank is treated as 0. */
  flexibleExpenses?: number | null;
  /** Mandatory monthly debt repayments (VND). */
  debtPayments: number;
  /** Minimum cash reserve the user wants to keep (VND). */
  safetyBuffer: number;
}

export interface UnexpectedExpense {
  /** 1-based forecast month. */
  month: number;
  amount: number;
  label?: string;
}

export type ScenarioKind = "baseline" | "income-reduction" | "interruption" | "unexpected-expense" | "combined";

export interface IncomeInterruption {
  /** 1-based first month with zero income. */
  startMonth: number;
  durationMonths: number;
}

export interface Scenario {
  name: string;
  kind?: ScenarioKind | undefined;
  /** Months with zero income, applied on top of any reduction. */
  interruption?: IncomeInterruption | null | undefined;
  horizon: Horizon;
  /** 0 – 100. */
  incomeReductionPct: number;
  unexpectedExpenses: UnexpectedExpense[];
}

export interface MonthProjection {
  month: number;
  income: number;
  outflow: number;
  unexpected: number;
  netCashFlow: number;
  closingBalance: number;
  belowBuffer: boolean;
  negative: boolean;
}

export type RiskLevel = "Low" | "Medium" | "High";

export interface RiskAssessment {
  level: RiskLevel;
  reasons: string[];
}

export interface SimulationResult {
  months: MonthProjection[];
  adjustedMonthlyIncome: number;
  lowestBalance: number;
  endingBalance: number;
  maxMonthlyGap: number;
  maxReserveDeficit: number;
  firstMonthBelowBuffer: number | null;
  firstNegativeMonth: number | null;
  runwayMonthsZeroIncome: number;
  minimumIncomeNeeded: number;
  risk: RiskAssessment;
}

export interface ScenarioComparison {
  baseline: SimulationResult;
  active: SimulationResult;
  deltaEndingBalance: number;
  deltaLowestBalance: number;
}
