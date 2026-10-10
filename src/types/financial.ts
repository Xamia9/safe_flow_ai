export type Horizon = 3 | 6 | 12;

export interface FinancialProfile {
  /** Cash available at the start of month 1 (VND). */
  openingBalance: number;
  /** Regular net monthly income before scenario adjustment (VND). */
  monthlyIncome: number;
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

export interface Scenario {
  name: string;
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
