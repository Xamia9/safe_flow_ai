/**
 * Deterministic, rule-based solution recommendation engine for SafeFlow AI.
 *
 * Selects up to three non-duplicative financial solution categories based on
 * the user's actual simulation profile, selected scenario, and calculated
 * results. No AI, no live business lookup, no fabricated data.
 *
 * Priority levels mirror the existing risk classification:
 *   High     — at least one negative month-end balance
 *   Medium   — no negative balance, but at least one month below the safety buffer
 *   Preventive — all months at or above the safety buffer
 */
import type { FinancialProfile, Scenario, SimulationResult } from "@/types/financial";
import { simulate } from "./financialCalculations";
import type { AdjustmentKind } from "./actionExperiments";

export type SolutionId =
  | "budget_optimization"
  | "income_stability"
  | "emergency_reserve"
  | "debt_payment_preparation"
  | "major_expense_planning"
  | "financial_support_advice"
  | "optional_financial_services";

export type RecPriority = "High" | "Medium" | "Preventive";

export type ImpactStatus = "quantified" | "not_quantified";

export interface ActionStep {
  text: string;
}

export interface Recommendation {
  solutionId: SolutionId;
  title: string;
  priority: RecPriority;
  triggerReasons: string[];
  relevantMetrics: string[];
  actionSteps: ActionStep[];
  expectedImpact: string;
  impactStatus: ImpactStatus;
  limitations: string[];
  missingInformation: string[];
  experimentSupported: boolean;
  /** Pre-built adjustments for the "Simulate again" button, when supported. */
  experimentAdjustments?: { kind: AdjustmentKind; amount: number }[];
}

export interface RecInput {
  profile: FinancialProfile;
  scenario: Scenario;
  result: SimulationResult;
}

interface Candidate {
  rec: Recommendation;
  priorityRank: number;
  /** Higher = more relevant to the identified cause. */
  relevance: number;
}

const priorityRank: Record<RecPriority, number> = { High: 0, Medium: 1, Preventive: 2 };

function derivePriority(result: SimulationResult): RecPriority {
  if (result.firstNegativeMonth !== null) return "High";
  if (result.firstMonthBelowBuffer !== null) return "Medium";
  return "Preventive";
}

function hasCashFlowPressure(result: SimulationResult): boolean {
  return result.maxMonthlyGap > 0 || result.months.some((m) => m.netCashFlow < 0);
}

function hasSeasonalVariation(profile: FinancialProfile): boolean {
  const low = profile.lowSeasonIncome;
  if (low === undefined) return false;
  return low < profile.monthlyIncome;
}

function hasIncomeReduction(scenario: Scenario): boolean {
  return (
    scenario.kind === "income-reduction" ||
    scenario.kind === "interruption" ||
    scenario.kind === "combined" ||
    scenario.incomeReductionPct > 0
  );
}

function hasUnexpectedExpense(scenario: Scenario): boolean {
  return scenario.unexpectedExpenses.length > 0 && scenario.unexpectedExpenses.some((e) => e.amount > 0);
}

function hasDebt(profile: FinancialProfile): boolean {
  return profile.debtPayments > 0;
}

/**
 * Build all eligible recommendation candidates from verified simulation data.
 * Each candidate addresses a distinct problem family.
 */
function buildCandidates(input: RecInput): Candidate[] {
  const { profile, scenario, result } = input;
  const priority = derivePriority(result);
  const rank = priorityRank[priority];
  const candidates: Candidate[] = [];

  /* ── Budget optimization ── */
  if (hasCashFlowPressure(result) && (profile.flexibleExpenses ?? 0) > 0) {
    const flex = profile.flexibleExpenses ?? 0;
    candidates.push({
      priorityRank: rank,
      relevance: result.firstNegativeMonth !== null ? 10 : 8,
      rec: {
        solutionId: "budget_optimization",
        title: "Review your flexible spending",
        priority,
        triggerReasons: [
          result.maxMonthlyGap > 0
            ? `Your largest monthly cash-flow gap is ${formatGap(result.maxMonthlyGap)}.`
            : "At least one month projects a negative cash flow.",
          `You currently have ${formatAmount(flex)} in monthly flexible spending that could be reviewed.`,
        ],
        relevantMetrics: ["maxMonthlyGap", "netCashFlow", "flexibleExpenses"],
        actionSteps: [
          { text: "List your current flexible expenses and identify which ones could be reduced or paused." },
          { text: "Prioritise essentials — do not cut mandatory debt payments or essential living costs without careful consideration." },
          { text: "Use the experiment panel below to test how reducing flexible spending by a specific amount could change your projected balance." },
        ],
        expectedImpact:
          "Reducing flexible spending can improve your monthly net cash flow and projected ending balance. Use the experiment panel to see the exact effect for your numbers.",
        impactStatus: "quantified",
        limitations: [
          "The simulation does not know which specific expenses are truly discretionary — that judgement is yours.",
          "Essential-expense reductions should only be made voluntarily and when feasible for your situation.",
        ],
        missingInformation: [],
        experimentSupported: true,
        experimentAdjustments: [{ kind: "cutFlexible", amount: Math.min(flex, Math.max(1_000_000, Math.round(flex / 2))) }],
      },
    });
  }

  /* ── Income stability ── */
  if (hasSeasonalVariation(profile) || hasIncomeReduction(scenario)) {
    const reasons: string[] = [];
    if (hasSeasonalVariation(profile)) {
      reasons.push(
        `Your low-season income (${formatAmount(profile.lowSeasonIncome!)}) is lower than your normal income (${formatAmount(profile.monthlyIncome)}).`,
      );
    }
    if (scenario.kind === "interruption" || scenario.incomeReductionPct >= 100) {
      reasons.push("Your selected scenario includes a full income interruption.");
    } else if (scenario.incomeReductionPct > 0) {
      reasons.push(`Your scenario includes a ${scenario.incomeReductionPct}% income reduction.`);
    }
    candidates.push({
      priorityRank: rank,
      relevance: hasIncomeReduction(scenario) ? 9 : 6,
      rec: {
        solutionId: "income_stability",
        title: "Plan for income variability",
        priority,
        triggerReasons: reasons,
        relevantMetrics: ["monthlyIncome", "lowSeasonIncome", "incomeReductionPct", "adjustedMonthlyIncome"],
        actionSteps: [
          { text: "Identify which months your income is typically lower and estimate how much lower it could be." },
          { text: "Consider realistic options for your situation: adjusting work hours, finding supplementary income, or building a buffer during higher-income months." },
          { text: "Use the experiment panel to test how a specific increase in monthly income could change your projection." },
        ],
        expectedImpact:
          "Additional income during low-season months can improve your projected balance. Use the experiment panel to see the effect of a specific income increase.",
        impactStatus: "quantified",
        limitations: [
          "The simulation cannot predict whether additional income is achievable — that depends on your circumstances.",
          "No specific earnings amount or employment outcome is guaranteed.",
        ],
        missingInformation: [],
        experimentSupported: true,
        experimentAdjustments: [{ kind: "raiseIncome", amount: Math.max(1_000_000, Math.round(profile.monthlyIncome * 0.1)) }],
      },
    });
  }

  /* ── Emergency reserve ── */
  const buffer = profile.safetyBuffer;
  const openingBelowBuffer = profile.openingBalance < buffer;
  const anyBelowBuffer = result.firstMonthBelowBuffer !== null;
  if (openingBelowBuffer || anyBelowBuffer) {
    const reasons: string[] = [];
    if (openingBelowBuffer) {
      reasons.push(
        `Your opening balance (${formatAmount(profile.openingBalance)}) is below your safety buffer of ${formatAmount(buffer)}.`,
      );
    }
    if (anyBelowBuffer) {
      reasons.push(`Your projected balance first falls below the safety buffer in month ${result.firstMonthBelowBuffer}.`);
    }
    candidates.push({
      priorityRank: rank,
      relevance: 7,
      rec: {
        solutionId: "emergency_reserve",
        title: "Build your emergency reserve",
        priority,
        triggerReasons: reasons,
        relevantMetrics: ["safetyBuffer", "openingBalance", "firstMonthBelowBuffer", "lowestBalance"],
        actionSteps: [
          { text: `Your safety buffer is ${formatAmount(buffer)} — one month of essential expenses plus mandatory debt payments.` },
          { text: "If you have a monthly surplus, consider setting aside a portion toward building your reserve over time." },
          { text: "Building savings depends on having available surplus — it is a gradual process, not an immediate fix for a projected shortfall." },
        ],
        expectedImpact:
          "Accumulating savings toward your safety buffer can reduce the likelihood of future buffer breaches. The pace depends on your available surplus.",
        impactStatus: "not_quantified",
        limitations: [
          "The safety buffer (essentials + debt) is a model-specific reserve target, not a universal emergency-fund recommendation.",
          "Reserve accumulation depends on available surplus and feasible contributions, which the simulation does not assume.",
          "Building savings is not an immediate solution to a projected cash shortfall in the coming months.",
        ],
        missingInformation: ["How much surplus you can realistically set aside each month"],
        experimentSupported: false,
      },
    });
  }

  /* ── Debt payment preparation ── */
  if (hasDebt(profile) && (hasCashFlowPressure(result) || anyBelowBuffer || result.firstNegativeMonth !== null)) {
    const reasons: string[] = [
      `You have mandatory debt payments of ${formatAmount(profile.debtPayments)} per month.`,
    ];
    if (result.firstNegativeMonth !== null) {
      reasons.push(`Your balance is projected to go negative in month ${result.firstNegativeMonth}.`);
    } else if (anyBelowBuffer) {
      reasons.push(`Your balance falls below the safety buffer in month ${result.firstMonthBelowBuffer}.`);
    } else {
      reasons.push("Your projection shows monthly cash-flow pressure.");
    }
    candidates.push({
      priorityRank: rank,
      relevance: 6,
      rec: {
        solutionId: "debt_payment_preparation",
        title: "Prepare for debt payments under pressure",
        priority,
        triggerReasons: reasons,
        relevantMetrics: ["debtPayments", "firstNegativeMonth", "firstMonthBelowBuffer", "maxMonthlyGap"],
        actionSteps: [
          { text: "Record the actual due dates and amounts of your current debt payments — this information is not captured in your simulation profile." },
          { text: "Review your payment schedule and confirm which payments are due within your simulation horizon." },
          { text: "Contact your existing lender to ask which relief options, if any, are available. Do not stop payments without confirmation." },
        ],
        expectedImpact:
          "Understanding your payment schedule and available lender options can help you avoid missed payments during a cash-flow squeeze. The simulation cannot quantify this.",
        impactStatus: "not_quantified",
        limitations: [
          "Actual payment due dates are not captured by the current profile and must be confirmed by you.",
          "The simulation does not know your lender's policies, available relief programmes, or eligibility.",
          "Refinancing or new borrowing may not be appropriate for your situation — seek individualised advice before deciding.",
          "Do not stop or reduce mandatory payments without explicit confirmation from your lender.",
        ],
        missingInformation: ["Actual payment due dates", "Lender contact details and available options"],
        experimentSupported: false,
      },
    });
  }

  /* ── Major expense planning ── */
  if (hasUnexpectedExpense(scenario)) {
    const expenses = scenario.unexpectedExpenses.filter((e) => e.amount > 0);
    const reasons = expenses.map(
      (e) => `Your scenario includes an unexpected expense of ${formatAmount(e.amount)} in month ${e.month}.`,
    );
    candidates.push({
      priorityRank: rank,
      relevance: 5,
      rec: {
        solutionId: "major_expense_planning",
        title: "Plan for major or unexpected expenses",
        priority,
        triggerReasons: reasons,
        relevantMetrics: ["unexpectedExpenses", "closingBalance"],
        actionSteps: [
          { text: "Confirm whether the unexpected expense in your scenario is a real upcoming cost or a hypothetical stress test." },
          { text: "If it is a real cost, note the expected timing and amount, and consider how to spread or prepare for it." },
          { text: "Use the experiment panel to test how reducing other spending or increasing income could offset the expense." },
        ],
        expectedImpact:
          "Planning ahead for a known major expense can reduce its impact on your projected balance. Use the experiment panel to test specific adjustments.",
        impactStatus: "quantified",
        limitations: [
          "The simulation treats each unexpected expense as a single one-off cost — it does not model instalments or phased spending.",
          "The current data model does not support separately entering planned future expenses outside the scenario shock.",
        ],
        missingInformation: [],
        experimentSupported: true,
        experimentAdjustments: [{ kind: "cutFlexible", amount: Math.min(profile.flexibleExpenses ?? 0, Math.max(1_000_000, Math.round((expenses[0]?.amount ?? 0) / 3))) }],
      },
    });
  }

  /* ── Financial support or advice ── */
  if (result.firstNegativeMonth !== null || (anyBelowBuffer && result.maxReserveDeficit > 0)) {
    candidates.push({
      priorityRank: rank,
      relevance: 4,
      rec: {
        solutionId: "financial_support_advice",
        title: "Consider seeking financial support or advice",
        priority,
        triggerReasons: result.firstNegativeMonth !== null
          ? [`Your balance is projected to go negative in month ${result.firstNegativeMonth}, indicating substantial financial pressure.`]
          : [`Your projected reserve deficit is ${formatAmount(result.maxReserveDeficit)}, and your balance falls below the safety buffer.`],
        relevantMetrics: ["firstNegativeMonth", "maxReserveDeficit", "firstMonthBelowBuffer"],
        actionSteps: [
          { text: "If you are facing immediate difficulty covering essential costs, consider contacting a recognised financial counselling service in your area." },
          { text: "Gather your current income, expense, and debt information before seeking advice — this will make the conversation more productive." },
          { text: "Additional information about your specific obligations and available support programmes would be needed for more targeted guidance." },
        ],
        expectedImpact:
          "Speaking with a qualified advisor or support service can help you navigate options the simulation cannot evaluate. The benefit cannot be quantified by this tool.",
        impactStatus: "not_quantified",
        limitations: [
          "The simulation cannot recommend specific organisations, aid programmes, or entitlements.",
          "Eligibility for support programmes depends on information not captured here.",
          "Live discovery of support services is a separate future capability.",
        ],
        missingInformation: ["Your location and jurisdiction", "Specific obligations and eligibility criteria"],
        experimentSupported: false,
      },
    });
  }

  return candidates;
}

/**
 * Select up to 3 non-duplicative recommendations.
 * Sorts by priority (High first), then relevance, then deduplicates by solutionId.
 * Returns fewer than 3 when fewer candidates qualify. Returns empty array if none qualify.
 */
export function selectRecommendations(input: RecInput): Recommendation[] {
  const candidates = buildCandidates(input);
  if (candidates.length === 0) return [];

  // Sort by priority rank, then by relevance descending.
  candidates.sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    return b.relevance - a.relevance;
  });

  // Deduplicate by solutionId (first occurrence wins).
  const seen = new Set<SolutionId>();
  const selected: Recommendation[] = [];
  for (const c of candidates) {
    if (seen.has(c.rec.solutionId)) continue;
    seen.add(c.rec.solutionId);
    selected.push(c.rec);
    if (selected.length >= 3) break;
  }

  return selected;
}

/** Convenience wrapper that runs simulate internally. */
export function getRecommendations(profile: FinancialProfile, scenario: Scenario): Recommendation[] {
  const result = simulate(profile, scenario);
  return selectRecommendations({ profile, scenario, result });
}

/** Priority badge styling matching existing RiskBadge conventions. */
export const priorityStyles: Record<RecPriority, string> = {
  High: "bg-negative-soft text-negative",
  Medium: "bg-warning-soft text-warning",
  Preventive: "bg-teal-soft text-teal",
};

export const priorityLabels: Record<RecPriority, string> = {
  High: "High priority",
  Medium: "Medium priority",
  Preventive: "Preventive",
};

/* ── Helpers ── */

function formatAmount(n: number): string {
  return `${Math.round(n).toLocaleString("en-US")} ₫`;
}

function formatGap(n: number): string {
  return formatAmount(n);
}
