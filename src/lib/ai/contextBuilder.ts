import type { FinancialProfile, Scenario, SimulationResult } from "@/types/financial";
import type { ScenarioSummary } from "@/lib/scenarioUpdates";
import type { Recommendation } from "@/lib/recommendations";
import type { ExperimentComparison } from "@/lib/actionExperiments";
import { formatVND, formatMonths } from "@/lib/formatCurrency";

/**
 * Build the text context string for the "Explain My Results" feature.
 * Includes only values that genuinely exist in the current result object.
 */
export function buildExplainResultsContext(
  profile: FinancialProfile,
  scenario: Scenario,
  result: SimulationResult,
  summary: ScenarioSummary,
): string {
  const lines: string[] = [];

  lines.push(`Scenario: ${summary.label}`);
  lines.push(`Horizon: ${scenario.horizon} months`);

  if (summary.reductionPct !== null) {
    lines.push(`Income reduction: ${summary.reductionPct}%`);
  }
  if (summary.affectedMonths) {
    lines.push(`Affected months: ${summary.affectedMonths}`);
  }
  for (const e of summary.expenses) {
    lines.push(`Unexpected expense in month ${e.month}: ${formatVND(e.amount)}`);
  }

  lines.push(`Safety buffer: ${formatVND(profile.safetyBuffer)}`);
  lines.push(`Opening balance: ${formatVND(profile.openingBalance)}`);
  lines.push(`Normal monthly income: ${formatVND(profile.monthlyIncome)}`);
  lines.push(`Essential expenses: ${formatVND(profile.essentialExpenses)}`);
  lines.push(`Debt payments: ${formatVND(profile.debtPayments)}`);
  if (profile.flexibleExpenses) {
    lines.push(`Flexible expenses: ${formatVND(profile.flexibleExpenses)}`);
  }

  lines.push(`Adjusted monthly income: ${formatVND(result.adjustedMonthlyIncome)}`);
  lines.push(`Ending balance: ${formatVND(result.endingBalance)}`);
  lines.push(`Lowest month-end balance: ${formatVND(result.lowestBalance)}`);
  if (result.lowestBalanceMonth !== null) {
    lines.push(`Lowest balance occurs in month ${result.lowestBalanceMonth}`);
  }
  lines.push(`Max monthly cash-flow gap: ${formatVND(result.maxMonthlyGap)}`);
  lines.push(`Max reserve deficit: ${formatVND(result.maxReserveDeficit)}`);
  lines.push(`Minimum income needed: ${formatVND(result.minimumIncomeNeeded)}`);
  lines.push(`Runway with zero income: ${formatMonths(result.runwayMonthsZeroIncome)}`);

  if (result.firstMonthBelowBuffer !== null) {
    lines.push(`First month below safety buffer: month ${result.firstMonthBelowBuffer}`);
  } else {
    lines.push("First month below safety buffer: none within horizon");
  }

  if (result.firstNegativeMonth !== null) {
    lines.push(`First negative-balance month: month ${result.firstNegativeMonth}`);
  } else {
    lines.push("First negative-balance month: none within horizon");
  }

  lines.push(`Risk classification: ${result.risk.level}`);
  if (result.risk.reasons.length > 0) {
    lines.push(`Risk reasons: ${result.risk.reasons.join("; ")}`);
  }

  // Monthly cash-flow summary (keep context under 8000 chars)
  const monthLines: string[] = [];
  for (const m of result.months) {
    monthLines.push(
      `Month ${m.month}: income ${formatVND(m.income)}, outflow ${formatVND(m.outflow)}, net ${formatVND(m.netCashFlow)}, closing ${formatVND(m.closingBalance)}, ${m.negative ? "negative" : m.belowBuffer ? "below buffer" : "above buffer"}`,
    );
  }
  const monthBlock = monthLines.join("\n");
  const remaining = 7800 - lines.join("\n").length;
  if (monthBlock.length <= remaining) {
    lines.push("Monthly projections:");
    lines.push(monthBlock);
  } else {
    lines.push("Monthly projections (first and last months only):");
    if (monthLines.length > 0) lines.push(monthLines[0]!);
    if (monthLines.length > 1) lines.push(monthLines[monthLines.length - 1]!);
  }

  return lines.join("\n");
}

/**
 * Build the text context string for the "Generate Personalized Action Plan" feature.
 * Includes the deterministic recommendation categories and computed experiment outcomes.
 */
export function buildActionPlanContext(
  profile: FinancialProfile,
  scenario: Scenario,
  result: SimulationResult,
  summary: ScenarioSummary,
  recs: Recommendation[],
  experiment: ExperimentComparison | null,
): string {
  const lines: string[] = [];

  lines.push(`Scenario: ${summary.label}, ${scenario.horizon} months`);
  lines.push(`Risk level: ${result.risk.level}`);
  lines.push(`Ending balance: ${formatVND(result.endingBalance)}`);
  lines.push(`Lowest balance: ${formatVND(result.lowestBalance)}`);

  lines.push("");
  lines.push(`Recommendation categories selected by the rule engine (${recs.length}):`);

  for (const rec of recs) {
    lines.push(`- ${rec.title} (${rec.priority} priority)`);
    lines.push(`  Reasons: ${rec.triggerReasons.join("; ")}`);
    lines.push(`  Action steps: ${rec.actionSteps.map((s) => s.text).join("; ")}`);
    lines.push(`  Expected impact: ${rec.expectedImpact}`);
    if (rec.limitations.length > 0) {
      lines.push(`  Limitations: ${rec.limitations.join("; ")}`);
    }
    lines.push("");
  }

  if (experiment && experiment.adjusted.risk.level !== experiment.baseline.risk.level) {
    lines.push("Experiment outcomes (tested adjustments vs baseline):");
    lines.push(`  Risk level: ${experiment.baseline.risk.level} -> ${experiment.adjusted.risk.level}`);
    lines.push(`  Lowest balance: ${formatVND(experiment.baseline.lowestBalance)} -> ${formatVND(experiment.adjusted.lowestBalance)}`);
    lines.push(`  Ending balance: ${formatVND(experiment.baseline.endingBalance)} -> ${formatVND(experiment.adjusted.endingBalance)}`);
    lines.push(`  Reserve deficit: ${formatVND(experiment.baseline.maxReserveDeficit)} -> ${formatVND(experiment.adjusted.maxReserveDeficit)}`);
    lines.push(`  Max monthly gap: ${formatVND(experiment.baseline.maxMonthlyGap)} -> ${formatVND(experiment.adjusted.maxMonthlyGap)}`);
  } else if (experiment) {
    lines.push("Experiment outcomes (tested adjustments vs baseline): no risk-level change detected.");
    lines.push(`  Lowest balance delta: ${formatVND(experiment.deltaLowestBalance)}`);
    lines.push(`  Ending balance delta: ${formatVND(experiment.deltaEndingBalance)}`);
  }

  lines.push("");
  lines.push("Safety buffer: " + formatVND(profile.safetyBuffer));

  return lines.join("\n");
}
